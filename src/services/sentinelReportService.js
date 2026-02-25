/**
 * sentinelReportService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Almacenamiento seguro de reportes ambientales.
 *
 * Las imágenes y metadatos NUNCA se guardan en la galería del dispositivo (DCIM).
 * Todo el payload se cifra con AES-256-GCM antes de escribirse en localStorage.
 * La cola de sincronización se procesa automáticamente cuando hay conexión disponible.
 */

import { encrypt, decrypt } from './sentinelCryptoService';

const REPORTS_KEY = 'sentinel_reports';
const SYNC_QUEUE_KEY = 'sentinel_sync_queue';

// Endpoint simulado de Antigravity (reemplazar con URL real en producción)
const ANTIGRAVITY_ENDPOINT = 'https://api.antigravity.eco/v1/sentinel/reports';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `SR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const getRawReports = () => JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');

const saveRawReports = (reports) => localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Guarda un reporte ambiental de forma cifrada.
 * La imagen se incluye en el payload como base64. Nunca toca la galería pública.
 *
 * @param {Object} reportPayload
 * @param {string} reportPayload.imageBase64 — imagen capturada (data URL)
 * @param {string} reportPayload.category — 'deforestation' | 'machinery' | 'water_pollution'
 * @param {Object} reportPayload.location — { lat, lng }
 * @param {number} reportPayload.heading — dirección de brújula en grados
 * @param {string} reportPayload.timestamp — ISO string
 * @returns {Promise<Object>} reporte guardado (sin datos sensibles en claro)
 */
export const saveReport = async (reportPayload) => {
    const id = generateId();
    const plaintext = JSON.stringify(reportPayload);
    const { iv, ciphertext } = await encrypt(plaintext);

    const entry = {
        id,
        iv,
        ciphertext,
        category: reportPayload.category, // Categoría en claro para el dashboard local
        status: 'pending',
        createdAt: new Date().toISOString(),
        syncedAt: null
    };

    const reports = getRawReports();
    reports.push(entry);
    saveRawReports(reports);

    // Agregar a la cola de sincronización
    addToSyncQueue({ type: 'SUBMIT_REPORT', reportId: id });

    console.log(`[Sentinel] Reporte ${id} guardado y cifrado. Total: ${reports.length}`);
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
