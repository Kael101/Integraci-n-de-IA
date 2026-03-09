import { useEffect, useRef, useCallback } from 'react';
import { fuzzCoordinates } from '../services/sentinelReportService';

/**
 * useRouteTracking
 *
 * Background hook que registra breadcrumbs de posición del usuario.
 * Guarda cada 5 minutos en localStorage y poda datos >3h.
 * Incluye exportación GPX 1.1, GeoJSON LineString y compartir vía WhatsApp.
 *
 * @param {Array} currentCoords - [longitude, latitude]
 */
const useRouteTracking = (currentCoords) => {
    const lastSaveTime = useRef(0);
    const TRACK_INTERVAL = 5 * 60 * 1000; // 5 minutos
    const HISTORY_LIMIT = 3 * 60 * 60 * 1000; // 3 horas
    const STORAGE_KEY = 'jaguar_movement_history';

    useEffect(() => {
        if (!currentCoords) return;
        const now = Date.now();
        if (now - lastSaveTime.current > TRACK_INTERVAL) {
            saveBreadcrumb(currentCoords, now);
            lastSaveTime.current = now;
        }
    }, [currentCoords]);

    const saveBreadcrumb = (coords, timestamp) => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            history.push({ coords, timestamp });
            const pruned = history.filter(p => (Date.now() - p.timestamp) < HISTORY_LIMIT);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        } catch (error) {
            console.error('[RouteTracking] Error saving breadcrumb:', error);
        }
    };

    /** Resumen legible del historial de movimiento */
    const getMovementSummary = () => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (history.length === 0) return 'Sin historial previo.';
            const lastPoint = history[history.length - 1];
            const minutesAgo = Math.round((Date.now() - lastPoint.timestamp) / 60000);
            return `Historial últimas 3h: ${history.length} puntos. Último hito hace ${minutesAgo} min.`;
        } catch {
            return 'Error leyendo historial.';
        }
    };

    // ─────────────────────────────────────────────
    // HELPERS INTERNOS
    // ─────────────────────────────────────────────

    /** Dispara descarga de un Blob como archivo */
    const _triggerDownload = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    /** Lee el historial actual del localStorage */
    const _loadHistory = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    };

    // ─────────────────────────────────────────────
    // EXPORT GPX 1.1
    // ─────────────────────────────────────────────

    /**
     * Exporta el historial de movimiento como archivo GPX 1.1.
     * Compatible con Garmin BaseCamp, Google Earth, Wikiloc, etc.
     *
     * @param {string}  [trackName]     - Nombre del track GPX
     * @param {boolean} [exportPrivate] - Si true, exporta coords exactas (default: false = fuzzeadas ±500m)
     */
    const exportAsGPX = useCallback((trackName = 'Territorio Jaguar — Ruta', exportPrivate = false) => {
        const history = _loadHistory();
        if (history.length === 0) {
            console.warn('[RouteTracking] Sin puntos para exportar.');
            return;
        }

        const privacyNote = exportPrivate
            ? ''
            : '<extensions><privacy>Waypoints approximated ±500m for user privacy</privacy></extensions>';

        const trkpts = history.map(({ coords, timestamp }) => {
            let [lon, lat] = coords;
            // Aplicar privacidad diferencial ±500m a la copia exportada
            if (!exportPrivate) {
                const fuzzed = fuzzCoordinates(lat, lon, 0.5); // 500m
                lat = fuzzed.lat;
                lon = fuzzed.lng;
            }
            const time = new Date(timestamp).toISOString();
            return `    <trkpt lat="${lat}" lon="${lon}"><time>${time}</time></trkpt>`;
        }).join('\n');

        const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Territorio Jaguar" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${trackName}</name>
    <time>${new Date().toISOString()}</time>
    ${privacyNote}
  </metadata>
  <trk>
    <name>${trackName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

        const filename = `jaguar_ruta_${Date.now()}${exportPrivate ? '_exact' : '_private'}.gpx`;
        _triggerDownload(gpx, filename, 'application/gpx+xml');
        console.log(`[RouteTracking] GPX exportado: ${filename} (${history.length} pts, privacy=${!exportPrivate})`);
    }, []);

    // ─────────────────────────────────────────────
    // EXPORT GEOJSON
    // ─────────────────────────────────────────────

    /**
     * Exporta el historial como GeoJSON LineString.
     * Compatible con Mapbox, QGIS, geojson.io, etc.
     *
     * @param {string}  [routeName]     - Nombre de la ruta
     * @param {boolean} [exportPrivate] - Si true, coords exactas (default: false = ±500m fuzz)
     */
    const exportAsGeoJSON = useCallback((routeName = 'Territorio Jaguar', exportPrivate = false) => {
        const history = _loadHistory();
        if (history.length === 0) {
            console.warn('[RouteTracking] Sin puntos para exportar.');
            return null;
        }

        const coordinates = history.map(({ coords }) => {
            let [lon, lat] = coords;
            if (!exportPrivate) {
                const fuzzed = fuzzCoordinates(lat, lon, 0.5); // 500m
                return [fuzzed.lng, fuzzed.lat];
            }
            return [lon, lat];
        });

        const startTime = new Date(history[0].timestamp).toISOString();
        const endTime = new Date(history[history.length - 1].timestamp).toISOString();

        const geojson = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: {
                    name: routeName,
                    points: history.length,
                    start: startTime,
                    end: endTime,
                    source: 'Territorio Jaguar PWA',
                    exported: new Date().toISOString(),
                    // Transparencia sobre privacidad diferencial
                    privacyRadius: exportPrivate ? 0 : 500,
                    privacyNote: exportPrivate
                        ? 'Exact coordinates'
                        : 'Waypoints approximated ±500m for user privacy (differential privacy)',
                },
            }],
        };

        const filename = `jaguar_ruta_${Date.now()}${exportPrivate ? '_exact' : '_private'}.geojson`;
        _triggerDownload(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
        console.log(`[RouteTracking] GeoJSON exportado: ${filename} (privacy=${!exportPrivate})`);
        return geojson;
    }, []);

    // ─────────────────────────────────────────────
    // COMPARTIR VÍA WHATSAPP
    // ─────────────────────────────────────────────

    /**
     * Comparte un resumen de la ruta actual vía WhatsApp.
     * Usa navigator.share() si está disponible; fallback a wa.me URL.
     * @param {string} [customMessage] - Mensaje personalizado opcional
     */
    const shareViaWhatsApp = useCallback(async (customMessage) => {
        const history = _loadHistory();
        const lastPoint = history[history.length - 1];

        const [lon, lat] = lastPoint?.coords || [0, 0];
        const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
        const summary = getMovementSummary();

        const message = customMessage ||
            `📍 *Territorio Jaguar — Check-in de Ruta*\n` +
            `${summary}\n` +
            `🗺️ Última posición: ${mapsUrl}\n` +
            `_Compartido desde Territorio Jaguar_`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Ruta Jaguar', text: message, url: mapsUrl });
                return;
            } catch (e) {
                if (e.name !== 'AbortError') console.warn('[RouteTracking] Share API error:', e);
            }
        }

        // Fallback WhatsApp URL
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, []);

    // ── Debug helpers (solo dev) ──────────────────
    if (typeof window !== 'undefined') {
        window.__debug_exportGeoJSON = exportAsGeoJSON;
        window.__debug_exportGPX = exportAsGPX;
    }

    return {
        getMovementSummary,
        exportAsGPX,
        exportAsGeoJSON,
        shareViaWhatsApp,
    };
};

export default useRouteTracking;
