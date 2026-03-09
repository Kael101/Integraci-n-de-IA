/**
 * sentinelReportService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Almacenamiento seguro de reportes ambientales.
 *
 * Las imágenes y metadatos NUNCA se guardan en la galería del dispositivo (DCIM).
 * Todo el payload se cifra con AES-256-GCM antes de escribirse en localStorage.
 * La cola de sincronización se procesa automáticamente cuando hay conexión disponible.
 *
 * PRIVACIDAD DE COORDENADAS:
 *  - location_public : coordenadas con ruido gaussiano ±1km (visible al público)
 *  - location_exact  : coordenadas exactas cifradas con AES-GCM (solo "Investigador Verificado")
 *  Esto protege a informantes y oculta hotspots de especies en riesgo crítico.
 */

import { encrypt, decrypt } from './sentinelCryptoService';

const REPORTS_KEY = 'sentinel_reports';
const SYNC_QUEUE_KEY = 'sentinel_sync_queue';

const ANTIGRAVITY_ENDPOINT = 'https://api.antigravity.eco/v1/sentinel/reports';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `SR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const getRawReports = () => JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
const saveRawReports = (reports) => localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

// ─── Coordinate Fuzzing (Box-Muller Gaussian) ─────────────────────────────────

/**
 * Genera coordenadas aproximadas con ruido gaussiano de ±radiusKm.
 * Usa el algoritmo Box-Muller para distribución normal real.
 * 1° latitud ≈ 111km  |  1° longitud ≈ 111km × cos(lat)
 *
 * @param {number} lat        - Latitud exacta
 * @param {number} lng        - Longitud exacta
 * @param {number} radiusKm   - Radio de ruido en km (default 1)
 * @returns {{ lat: number, lng: number }} — Coordenada aproximada
 */
export const fuzzCoordinates = (lat, lng, radiusKm = 1) => {
    // Box-Muller: convert uniform → standard normal
    const u1 = Math.random() || 1e-10; // evitar ln(0)
    const u2 = Math.random();
    const magnitude = Math.sqrt(-2 * Math.log(u1));
    const z0 = magnitude * Math.cos(2 * Math.PI * u2);
    const z1 = magnitude * Math.sin(2 * Math.PI * u2);

    const degPerKmLat = 1 / 111;
    const degPerKmLng = 1 / (111 * Math.cos((lat * Math.PI) / 180));

    // Sigma = radiusKm/3 para que ~99.7% del ruido quede dentro del radio
    const sigma = radiusKm / 3;

    return {
        lat: parseFloat((lat + z0 * sigma * degPerKmLat).toFixed(6)),
        lng: parseFloat((lng + z1 * sigma * degPerKmLng).toFixed(6)),
    };
};

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Guarda un reporte ambiental de forma cifrada.
 * Almacena location_public (fuzzed ±1km) y location_exact (AES cifrada).
 *
 * @param {Object} reportPayload
 * @param {string} reportPayload.imageBase64 — imagen capturada (data URL)
 * @param {string} reportPayload.category  — 'deforestation' | 'machinery' | 'water_pollution'
 * @param {Object} reportPayload.location  — { lat, lng } exactas
 * @param {number} reportPayload.heading   — dirección de brújula en grados
 * @param {string} reportPayload.timestamp — ISO string
 * @returns {Promise<Object>} reporte guardado
 */
export const saveReport = async (reportPayload) => {
    const id = generateId();

    // 1. Generar coordenada pública aproximada (±1km)
    const { lat, lng } = reportPayload.location || { lat: -2.3, lng: -78.1 };
    const locationPublic = fuzzCoordinates(lat, lng, 1);

    // 2. Cifrar coordenadas exactas por separado
    const exactLocationStr = JSON.stringify({ lat, lng });
    const { iv: locIv, ciphertext: locCt } = await encrypt(exactLocationStr);

    // 3. Cifrar el payload completo (incluye imagen)
    const plaintext = JSON.stringify({
        ...reportPayload,
        location: locationPublic, // el payload cifrado guarda la fuzzed
        _location_exact_note: 'Stored separately as location_exact_iv + location_exact_ciphertext',
    });
    const { iv, ciphertext } = await encrypt(plaintext);

    const entry = {
        id,
        iv,
        ciphertext,
        // Coords públicas en claro (aproximadas, seguras para heatmap)
        location_public: locationPublic,
        // Coords exactas cifradas (solo rol "Investigador Verificado" puede descifrar)
        location_exact_iv: locIv,
        location_exact_ciphertext: locCt,
        category: reportPayload.category,
        status: 'pending',
        createdAt: new Date().toISOString(),
        syncedAt: null,
    };

    const reports = getRawReports();
    reports.push(entry);
    saveRawReports(reports);

    addToSyncQueue({ type: 'SUBMIT_REPORT', reportId: id });

    console.log(`[Sentinel] Reporte ${id} guardado. Coords públicas: ±1km | Exactas: AES-cifradas`);
    return entry;
};

/**
 * Retorna todos los reportes descifrados.
 * @returns {Promise<Array>}
 */
export const getReports = async () => {
    const raw = getRawReports();
    const decrypted = await Promise.all(
        raw.map(async (entry) => {
            try {
                const plaintext = await decrypt(entry.iv, entry.ciphertext);
                const payload = JSON.parse(plaintext);
                return {
                    ...entry,
                    ...payload,
                    ciphertext: '[CIFRADO]',
                    iv: '[CIFRADO]'
                };
            } catch {
                return { ...entry, decryptError: true };
            }
        })
    );
    return decrypted;
};

/**
 * Retorna solo los metadatos públicos de los reportes (sin imagen, sin coords exactas).
 * Útil para el dashboard de heatmap sin exponer datos sensibles.
 * @returns {Array}
 */
export const getReportsSummary = () => {
    return getRawReports().map(({ id, category, status, createdAt, syncedAt }) => ({
        id, category, status, createdAt, syncedAt
    }));
};

/**
 * Elimina un reporte por ID.
 * @param {string} id
 */
export const deleteReport = (id) => {
    const filtered = getRawReports().filter(r => r.id !== id);
    saveRawReports(filtered);
};

// ─── Cola de Sincronización ───────────────────────────────────────────────────

const addToSyncQueue = (action) => {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    queue.push({ ...action, queuedAt: Date.now() });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

    if (navigator.onLine) {
        processSyncQueue();
    }
};

/**
 * Procesa la cola de sincronización cuando hay conexión.
 * Simula el envío al servidor de Antigravity.
 */
export const processSyncQueue = async () => {
    if (!navigator.onLine) return;

    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    console.log(`[Sentinel] Sincronizando ${queue.length} reporte(s) en segundo plano...`);

    const remaining = [];

    for (const item of queue) {
        try {
            if (item.type === 'SUBMIT_REPORT') {
                // Obtener el reporte cifrado para enviar
                const reports = getRawReports();
                const report = reports.find(r => r.id === item.reportId);

                if (report) {
                    // En producción: await fetch(ANTIGRAVITY_ENDPOINT, { method: 'POST', body: JSON.stringify(report) })
                    // Simulamos el envío:
                    await new Promise(resolve => setTimeout(resolve, 800));
                    console.log(`[Sentinel] ✅ Reporte ${item.reportId} enviado a Antigravity.`);

                    // Marcar como sincronizado
                    const updated = reports.map(r =>
                        r.id === item.reportId
                            ? { ...r, status: 'synced', syncedAt: new Date().toISOString() }
                            : r
                    );
                    saveRawReports(updated);
                }
            }
        } catch (err) {
            console.warn(`[Sentinel] Error sincronizando item, reintentando después:`, err);
            remaining.push(item); // Re-encolar si falló
        }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
};

// Escuchar reconexión para sincronizar automáticamente
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[Sentinel] Conexión restaurada. Iniciando sincronización silenciosa...');
        processSyncQueue();
    });
}

export default { saveReport, getReports, getReportsSummary, deleteReport, processSyncQueue };
