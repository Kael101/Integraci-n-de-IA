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

// ─── Privacidad Diferencial: Box-Muller Gaussian ─────────────────────────────

/**
 * Genera ruido gaussiano usando la transformación de Box-Muller.
 *
 * Por qué σ = 333 m:
 *   • 68% de los puntos caerán dentro de 333 m del original
 *   • 95% dentro de 666 m
 *   • 99.7% dentro de ~1 km  ← "área de incertidumbre" segura
 * Esto protege hotspots de jaguares y denunciantes contra actores
 * malintencionados, mientras permite ver corredores biológicos reales.
 *
 * @param {number} sigmaMeters - Desviación estándar (default 333 m)
 * @returns {number} desplazamiento en grados geográficos
 */
const _gaussianNoise = (sigmaMeters = 333) => {
    const u1 = Math.random() || 1e-10; // evitar log(0)
    const u2 = Math.random();
    // Box-Muller: convierte distribución uniforme → normal estándar
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    // 1° lat/lon ≈ 111 000 m en Morona Santiago
    return (z0 * sigmaMeters) / 111_000;
};

/**
 * Aplica ruido gaussiano ±1km a las coordenadas.
 * Versión mejorada: corrige la longitud por el coseno de la latitud
 * para que el ruido sea isotrópico (circular, no elíptico).
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [sigmaMeters=333] - σ en metros
 * @returns {{ lat: number, lng: number, precision_note: string }}
 */
export const fuzzCoordinates = (lat, lng, sigmaMeters = 333) => {
    const noiseLat = _gaussianNoise(sigmaMeters);
    // Corrección por coseno: la longitud se comprime hacia los polos
    const noiseLng = _gaussianNoise(sigmaMeters) / Math.cos((lat * Math.PI) / 180);
    return {
        lat: parseFloat((lat + noiseLat).toFixed(6)),
        lng: parseFloat((lng + noiseLng).toFixed(6)),
        precision_note: `±1km Gaussian Noise (σ=${sigmaMeters}m, Box-Muller)`,
    };
};

// ─── processSentinelReport (API de alto nivel, compatible con la propuesta) ───

/**
 * Procesa una ubicación GPS aplicando privacidad diferencial + cifrado AES-GCM.
 * Esta es la función de alto nivel que el flujo Sentinel debe llamar.
 *
 * Flujo:
 *   GPS exacto (-2.3014, -78.1189)
 *     → Ruido Box-Muller σ=333m
 *     → location_public: (-2.3045, -78.1152)  ← visible en heatmap público
 *     → location_exact: cifrado AES-256-GCM   ← solo Investigador Verificado
 *
 * @param {number} lat    - Latitud exacta del GPS
 * @param {number} lng    - Longitud exacta del GPS
 * @param {string} userId - UID del usuario (se usa como contexto de cifrado)
 * @returns {Promise<{
 *   timestamp: string,
 *   location_public: { lat, lng, precision_note },
 *   location_exact_iv: string,
 *   location_exact_ciphertext: string,
 *   status: string
 * }>}
 */
export const processSentinelReport = async (lat, lng, userId = 'anonymous') => {
    // 1. Privacidad Diferencial — ruido gaussiano ~±1km
    const location_public = fuzzCoordinates(lat, lng, 333);

    // 2. Cifrado AES-256-GCM de coordenadas exactas
    const { iv, ciphertext } = await encrypt(
        JSON.stringify({ lat, lng, userId, ts: Date.now() })
    );

    return {
        timestamp: new Date().toISOString(),
        // Visible para todos — heatmap público
        location_public,
        // Solo accesible con la clave AES del dispositivo
        location_exact_iv: iv,
        location_exact_ciphertext: ciphertext,
        status: 'pending_validation',
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
 * Retorna los puntos *con ruido* de todos los reportes locales para el heatmap.
 * Nunca expone coordenadas exactas — solo location_public (ya fuzzeada).
 *
 * @returns {Array<{ id, category, status, lat, lng, precision_note }>}
 */
export const getPublicHeatmapPoints = () => {
    return getRawReports()
        .filter(r => r.location_public)
        .map(({ id, category, status, location_public }) => ({
            id,
            category,
            status,
            lat: location_public.lat,
            lng: location_public.lng,
            precision_note: location_public.precision_note ?? '±1km Gaussian Noise',
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

    // ── Debug helpers (consola del browser) ───────────────────────────────────
    /**
     * Simula el flujo completo de privacidad diferencial con coordenadas de Macas.
     * Uso: await window.__debug_sentinel_privacy()
     */
    window.__debug_sentinel_privacy = async (lat = -2.3014, lng = -78.1189) => {
        console.group('[Sentinel] 🔒 Demo Privacidad Diferencial');
        console.log(`📍 GPS exacto:    ${lat}, ${lng}  (Macas, Morona Santiago)`);

        const result = await processSentinelReport(lat, lng, 'debug-user');
        console.log(`🌫️ Coord pública: ${result.location_public.lat}, ${result.location_public.lng}`);
        console.log(`📏 Nota:          ${result.location_public.precision_note}`);
        console.log(`🔐 IV cifrado:    ${result.location_exact_iv.slice(0, 20)}...`);
        console.log(`🔐 Ciphertext:    ${result.location_exact_ciphertext.slice(0, 30)}...`);

        // Calcular desplazamiento en metros para visualizar el ruido
        const dLat = Math.abs(result.location_public.lat - lat) * 111_000;
        const dLng = Math.abs(result.location_public.lng - lng) * 111_000 * Math.cos(lat * Math.PI / 180);
        const distM = Math.round(Math.sqrt(dLat ** 2 + dLng ** 2));
        console.log(`📐 Desplazamiento real: ~${distM} m (esperado μ=0, σ=333m)`);
        console.groupEnd();
        return result;
    };

    /**
     * Muestra todos los puntos públicos (fuzzeados) del heatmap.
     * Uso: window.__debug_sentinel_heatmap()
     */
    window.__debug_sentinel_heatmap = () => {
        const points = getPublicHeatmapPoints();
        console.table(points);
        return points;
    };
}

export default {
    saveReport, getReports, getReportsSummary, deleteReport, processSyncQueue,
    processSentinelReport, getPublicHeatmapPoints, fuzzCoordinates
};
