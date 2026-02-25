/**
 * sentinelCryptoService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cifrado AES-256-GCM usando la Web Crypto API nativa del browser.
 * Sin dependencias externas. La clave se genera una sola vez y se
 * persiste en localStorage (codificada en base64).
 *
 * Seguridad: Todo el material sensible (fotos, coords GPS, metadatos)
 * se cifra en el dispositivo antes de escribirse en localStorage.
 * El ciphertext es ilegible sin la clave.
 */

const KEY_STORAGE_KEY = 'sentinel_aes_key';
const ALGORITHM = { name: 'AES-GCM', length: 256 };

// ─── Helpers de conversión ────────────────────────────────────────────────────

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// ─── Gestión de Clave ─────────────────────────────────────────────────────────

/**
 * Genera una nueva clave AES-256-GCM y la exporta como base64 para
 * persistirla en localStorage.
 */
const generateAndPersistKey = async () => {
    const cryptoKey = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt']);
    const exported = await crypto.subtle.exportKey('raw', cryptoKey);
    localStorage.setItem(KEY_STORAGE_KEY, arrayBufferToBase64(exported));
    return cryptoKey;
};

/**
 * Recupera la clave desde localStorage o genera una nueva si no existe.
 * @returns {Promise<CryptoKey>}
 */
const getOrCreateKey = async () => {
    const stored = localStorage.getItem(KEY_STORAGE_KEY);
    if (!stored) return generateAndPersistKey();

    try {
        const keyBuffer = base64ToArrayBuffer(stored);
        return await crypto.subtle.importKey('raw', keyBuffer, ALGORITHM, false, ['encrypt', 'decrypt']);
    } catch {
        // Si la clave está corrupta, genera una nueva (los reportes viejos se pierden)
        console.warn('[Sentinel] Clave AES corrupta. Generando nueva clave.');
        return generateAndPersistKey();
    }
};

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Cifra un string (JSON, texto plano, base64 de imagen) con AES-256-GCM.
 * @param {string} plaintext
 * @returns {Promise<{ iv: string, ciphertext: string }>} — ambos en base64
 */
export const encrypt = async (plaintext) => {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits para GCM
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    return {
        iv: arrayBufferToBase64(iv.buffer),
        ciphertext: arrayBufferToBase64(ciphertextBuffer)
    };
};

/**
 * Descifra un payload cifrado con encrypt().
 * @param {string} iv — base64
 * @param {string} ciphertext — base64
 * @returns {Promise<string>} — texto plano original
 */
export const decrypt = async (iv, ciphertext) => {
    const key = await getOrCreateKey();
    const ivBuffer = base64ToArrayBuffer(iv);
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
        key,
        ciphertextBuffer
    );

    return new TextDecoder().decode(decrypted);
};

export default { encrypt, decrypt };
