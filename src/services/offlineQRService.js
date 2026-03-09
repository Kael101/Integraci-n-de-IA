/**
 * offlineQRService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generación y verificación de tokens QR de reserva offline.
 * Firma con HMAC-SHA256 (Web Crypto API nativa) — sin dependencias externas.
 *
 * FLUJO:
 *   1. Usuario reserva producto desde mapa (sin señal)
 *   2. generateReservationToken() → firma HMAC-SHA256 + base64url
 *   3. Token se muestra como texto QR en pantalla del comprador
 *   4. Vendedor escanea / ingresa token → verifyToken() confirma autenticidad
 *   5. Al recuperar señal → syncService sube la reserva a Firestore
 *
 * SEGURIDAD:
 *   - Clave HMAC generada una sola vez por dispositivo (localStorage)
 *   - Token tiene TTL de 24h (expiry embebido y verificado)
 *   - groupSize soportado para reservas de grupos
 */

const HMAC_KEY_STORAGE = 'tj_hmac_key_b64';
const RESERVATIONS_KEY = 'tj_offline_reservations';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ─── Helpers Base64url ────────────────────────────────────────────────────────

const toBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const fromBase64url = (str) => {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/')
        + '=='.slice(0, (4 - str.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

// ─── Gestión de Clave HMAC ────────────────────────────────────────────────────

const getOrCreateHMACKey = async () => {
    const stored = localStorage.getItem(HMAC_KEY_STORAGE);

    if (stored) {
        try {
            return await crypto.subtle.importKey(
                'raw',
                fromBase64url(stored),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign', 'verify']
            );
        } catch {
            console.warn('[offlineQR] Clave HMAC corrupta, regenerando.');
        }
    }

    // Generar nueva clave
    const key = await crypto.subtle.generateKey(
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign', 'verify']
    );
    const raw = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(HMAC_KEY_STORAGE, toBase64url(raw));
    return key;
};

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Genera un token de reserva offline firmado con HMAC-SHA256.
 *
 * @param {object} params
 * @param {string} params.productId    - ID del producto/servicio
 * @param {string} params.productName  - Nombre legible del producto
 * @param {string} params.area         - Nombre del área / comunidad
 * @param {string} [params.userId]     - UID del usuario (o anónimo)
 * @param {number} [params.groupSize]  - Tamaño del grupo (default: 1)
 * @returns {Promise<{ token: string, payload: object, expiresAt: string }>}
 */
export const generateReservationToken = async ({
    productId,
    productName,
    area,
    userId = 'anon',
    groupSize = 1,
}) => {
    const now = Date.now();
    const payload = {
        productId,
        productName,
        area,
        userId,
        groupSize: Math.max(1, Math.floor(groupSize)),
        ts: now,
        expiresAt: now + TOKEN_TTL_MS,
        v: 1, // versión del esquema
    };

    const payloadB64 = toBase64url(new TextEncoder().encode(JSON.stringify(payload)));

    const key = await getOrCreateHMACKey();
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payloadB64)
    );
    const signature = toBase64url(signatureBuffer);

    // Token = payload.signature (como JWT simplificado)
    const token = `${payloadB64}.${signature}`;

    // Persistir reserva localmente
    _saveReservation({ ...payload, token, status: 'pending' });

    console.log(`[offlineQR] ✅ Token generado para "${productName}" × ${groupSize} persona(s)`);

    return {
        token,
        payload,
        expiresAt: new Date(payload.expiresAt).toLocaleTimeString('es-EC'),
    };
};

/**
 * Verifica un token de reserva offline.
 * Devuelve el payload si es válido, o null si inválido/expirado.
 *
 * @param {string} token
 * @returns {Promise<{ valid: boolean, payload: object|null, reason: string }>}
 */
export const verifyToken = async (token) => {
    try {
        const [payloadB64, signature] = token.split('.');
        if (!payloadB64 || !signature) {
            return { valid: false, payload: null, reason: 'Formato inválido' };
        }

        const key = await getOrCreateHMACKey();
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            fromBase64url(signature),
            new TextEncoder().encode(payloadB64)
        );

        if (!isValid) {
            return { valid: false, payload: null, reason: 'Firma inválida' };
        }

        const payload = JSON.parse(new TextDecoder().decode(fromBase64url(payloadB64)));

        if (Date.now() > payload.expiresAt) {
            return { valid: false, payload, reason: 'Token expirado' };
        }

        return { valid: true, payload, reason: 'OK' };
    } catch (err) {
        return { valid: false, payload: null, reason: `Error: ${err.message}` };
    }
};

/**
 * Lista todas las reservas offline pendientes de sincronizar.
 * @returns {Array<object>}
 */
export const getPendingReservations = () => {
    try {
        return JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]');
    } catch {
        return [];
    }
};

/**
 * Marca una reserva como sincronizada (después de subir a Firestore).
 * @param {string} token
 */
export const markReservationSynced = (token) => {
    try {
        const all = getPendingReservations();
        const updated = all.map(r => r.token === token ? { ...r, status: 'synced' } : r);
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('[offlineQR] Error marking synced:', e);
    }
};

// ─── Private ─────────────────────────────────────────────────────────────────

const _saveReservation = (reservation) => {
    try {
        const all = getPendingReservations();
        all.push(reservation);
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(all));
    } catch (e) {
        console.error('[offlineQR] Error saving reservation:', e);
    }
};

// ── Debug helpers ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.__debug_generateQR = async (productId = '1', area = 'cascada-upano', groupSize = 1) => {
        const result = await generateReservationToken({
            productId, area, groupSize,
            productName: `Producto Demo #${productId}`,
        });
        console.log('[offlineQR Debug]', result);
        return result;
    };

    window.__debug_verifyQR = async (token) => {
        const result = await verifyToken(token);
        console.log('[offlineQR Debug] Verify:', result);
        return result;
    };
}

export default { generateReservationToken, verifyToken, getPendingReservations, markReservationSynced };
