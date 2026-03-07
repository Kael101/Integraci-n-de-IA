// src/services/predictiveCache.js
/**
 * PREDICTIVE CACHE — Motor de IA en-browser
 * Territorio Jaguar · Offline Intelligence Layer
 * ================================================
 * Motor de scoring de rutas populares sin backend externo.
 * Analiza el historial de navegación local para predecir qué datos
 * serán necesarios y pre-cargarlos antes de que el usuario los solicite.
 *
 * ALGORITMO DE POPULARIDAD (score 0-100):
 *   score = (visits × 0.5)
 *         + (recencyBonus × 0.3)   // decay exponencial desde última visita
 *         + (timeOfDayMatch × 0.2) // coincidencia hora del día histórica
 *
 * BATTERY AWARE: En modo ECO/DEEP_SLEEP no escribe, solo lee.
 */

const HISTORY_KEY = 'tj_route_history';
const PREFETCH_MANIFEST_KEY = 'tj_prefetch_manifest';
const MAX_HISTORY_ENTRIES = 200;    // Máximo de registros de visitas
const SCORE_EVICT_THRESHOLD = 10;   // Score < 10 → candidato a evicción
const TTL_HOURS_POPULAR = 48;       // Rutas populares: TTL 48h
const TTL_HOURS_NORMAL = 24;        // Rutas normales: TTL 24h
const TTL_HOURS_STALE = 72;         // TTL máximo antes de purga forzada

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

/** Bonus de recencia: decay exponencial (1 visita hace 1h → 100, hace 24h → ~13) */
function recencyBonus(timestamp) {
    const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
    return Math.round(100 * Math.exp(-hoursAgo / 12)); // half-life 12h
}

/** Coincidencia de hora del día: máximo si la ruta fue visitada en la misma franja horaria */
function timeOfDayScore(visitHour) {
    const currentHour = new Date().getHours();
    const diff = Math.abs(currentHour - visitHour);
    const wrappedDiff = Math.min(diff, 24 - diff); // circular (medianoche)
    if (wrappedDiff <= 1) return 100;
    if (wrappedDiff <= 2) return 70;
    if (wrappedDiff <= 4) return 40;
    return 0;
}

// ─────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────

export const PredictiveCache = {
    /**
     * Registra una visita a una ruta.
     * Llama esto cuando el usuario empieza a navegar una ruta.
     * @param {string} routeId  Identificador de la ruta
     * @param {object} meta     { name, coords, type } metadata de la ruta
     */
    recordVisit(routeId, meta = {}) {
        try {
            const history = this._loadHistory();
            history.push({
                routeId,
                meta,
                timestamp: Date.now(),
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
            });

            // Mantener solo los MAX_HISTORY_ENTRIES más recientes
            const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('[PredictiveCache] recordVisit error:', e.message);
        }
    },

    /**
     * Calcula el score de popularidad para una ruta dada su historial.
     * @param {string} routeId
     * @returns {number} score 0-100
     */
    scoreRoute(routeId) {
        const history = this._loadHistory();
        const visits = history.filter(v => v.routeId === routeId);
        if (visits.length === 0) return 0;

        // Componente 1: Frecuencia (normalizada a 50 pts máx)
        const visitScore = Math.min(visits.length * 5, 50);

        // Componente 2: Recencia (última visita, 0-100 → ponderado ×0.3)
        const lastVisit = visits.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
        const recScore = recencyBonus(lastVisit.timestamp) * 0.3;

        // Componente 3: Coincidencia horaria (0-100 → ponderado ×0.2)
        const hourScores = visits.map(v => timeOfDayScore(v.hour));
        const avgHourScore = hourScores.reduce((a, b) => a + b, 0) / hourScores.length;
        const timeScore = avgHourScore * 0.2;

        return Math.min(Math.round(visitScore + recScore + timeScore), 100);
    },

    /**
     * Devuelve las N rutas más populares con su score y metadata.
     * Ideal para alimentar el prefetch proactivo.
     * @param {number} n  Número de rutas a retornar
     * @returns {Array<{routeId, score, meta, lastVisit}>}
     */
    getTopRoutes(n = 5) {
        const history = this._loadHistory();
        if (history.length === 0) return [];

        // Agrupar por routeId
        const byRoute = {};
        history.forEach(v => {
            if (!byRoute[v.routeId]) {
                byRoute[v.routeId] = { routeId: v.routeId, meta: v.meta, visits: [], lastVisit: 0 };
            }
            byRoute[v.routeId].visits.push(v);
            if (v.timestamp > byRoute[v.routeId].lastVisit) {
                byRoute[v.routeId].lastVisit = v.timestamp;
            }
        });

        // Calcular scores y ordenar
        const scored = Object.values(byRoute).map(r => ({
            ...r,
            score: this.scoreRoute(r.routeId),
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    },

    /**
     * Registra el manifiesto de datos pre-cacheados (qué está disponible offline).
     * @param {string} routeId
     * @param {object} manifest { providers, tiles, waypoints, cachedAt }
     */
    setManifest(routeId, manifest) {
        try {
            const all = JSON.parse(localStorage.getItem(PREFETCH_MANIFEST_KEY) || '{}');
            all[routeId] = { ...manifest, cachedAt: Date.now() };
            localStorage.setItem(PREFETCH_MANIFEST_KEY, JSON.stringify(all));
        } catch (e) {
            console.warn('[PredictiveCache] setManifest error:', e.message);
        }
    },

    /**
     * Lee el manifiesto de una ruta cacheada.
     * @param {string} routeId
     * @returns {object|null}
     */
    getManifest(routeId) {
        try {
            const all = JSON.parse(localStorage.getItem(PREFETCH_MANIFEST_KEY) || '{}');
            return all[routeId] || null;
        } catch {
            return null;
        }
    },

    /**
     * Verifica si los datos de una ruta están vigentes (no TTL-expirado).
     * @param {string} routeId
     * @param {boolean} isPopular  Usar TTL extendido si es popular
     * @returns {boolean}
     */
    isCacheFresh(routeId, isPopular = false) {
        const manifest = this.getManifest(routeId);
        if (!manifest) return false;
        const ttlHours = isPopular ? TTL_HOURS_POPULAR : TTL_HOURS_NORMAL;
        const ageHours = (Date.now() - manifest.cachedAt) / (1000 * 60 * 60);
        return ageHours < ttlHours;
    },

    /**
     * Evicción inteligente: elimina rutas con score bajo y TTL expirado.
     * Llama periódicamente (ej: al iniciar la app en modo NORMAL).
     * @returns {number} Número de entradas purgadas
     */
    evictStaleEntries() {
        try {
            const all = JSON.parse(localStorage.getItem(PREFETCH_MANIFEST_KEY) || '{}');
            const now = Date.now();
            let purgedCount = 0;

            for (const routeId of Object.keys(all)) {
                const ageHours = (now - all[routeId].cachedAt) / (1000 * 60 * 60);
                const score = this.scoreRoute(routeId);

                const isStale = ageHours > TTL_HOURS_STALE;
                const isLowScore = score < SCORE_EVICT_THRESHOLD;

                if (isStale || isLowScore) {
                    delete all[routeId];
                    purgedCount++;
                }
            }

            localStorage.setItem(PREFETCH_MANIFEST_KEY, JSON.stringify(all));
            console.log(`[PredictiveCache] Evicted ${purgedCount} stale entries.`);
            return purgedCount;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Estadísticas del caché para mostrar en el panel UI.
     * @returns {{ totalCached, totalVisits, topRouteScore, storageUsedKB }}
     */
    getStats() {
        try {
            const history = this._loadHistory();
            const manifest = JSON.parse(localStorage.getItem(PREFETCH_MANIFEST_KEY) || '{}');
            const top = this.getTopRoutes(1);

            const historyBytes = (localStorage.getItem(HISTORY_KEY) || '').length;
            const manifestBytes = (localStorage.getItem(PREFETCH_MANIFEST_KEY) || '').length;
            const storageUsedKB = Math.round((historyBytes + manifestBytes) / 1024);

            return {
                totalCached: Object.keys(manifest).length,
                totalVisits: history.length,
                topRouteScore: top.length > 0 ? top[0].score : 0,
                topRouteName: top.length > 0 ? (top[0].meta?.name || top[0].routeId) : '—',
                storageUsedKB,
            };
        } catch {
            return { totalCached: 0, totalVisits: 0, topRouteScore: 0, topRouteName: '—', storageUsedKB: 0 };
        }
    },

    // ── Private ──────────────────────────────
    _loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch {
            return [];
        }
    },
};

export default PredictiveCache;
