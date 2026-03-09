import { useState, useEffect } from 'react';
import { generateReservationToken, getPendingReservations } from '../services/offlineQRService';

/**
 * Hook for Deferred Synchronization of Check-Ins.
 * Stores data locally and syncs when online.
 * Follows the privacy-first JSON structure.
 */
export const useCheckInSync = () => {
    const [checkIns, setCheckIns] = useState([]);
    const [pendingSync, setPendingSync] = useState(0);

    // Mock initial data (Privacy First Structure)
    const initialData = [
        { trip_id: "uuid-1", area: "Cascada del Alto Upano", status: "completed", timestamp: "2026-02-01T09:00:00Z", latitude: -2.30, longitude: -78.12 },
        { trip_id: "uuid-2", area: "Bosque Medicinal Shuar", status: "in_progress", timestamp: "2026-02-01T10:15:00Z", latitude: -2.35, longitude: -78.05 },
        { trip_id: "uuid-3", area: "Cueva de los Tayos (Entrada)", status: "completed", timestamp: "2026-01-31T15:30:00Z", latitude: -3.05, longitude: -78.22 },
        { trip_id: "uuid-4", area: "Macas Centro", status: "completed", timestamp: "2026-02-01T08:00:00Z", latitude: -2.31, longitude: -78.11 },
        { trip_id: "uuid-5", area: "Macas Centro", status: "completed", timestamp: "2026-02-01T08:30:00Z", latitude: -2.312, longitude: -78.115 }
    ];

    useEffect(() => {
        // Load from LocalStorage
        const stored = localStorage.getItem('gremio_checkins');
        if (stored) {
            setCheckIns(JSON.parse(stored));
        } else {
            setCheckIns(initialData);
        }

        // Check for pending items to sync
        const pending = JSON.parse(localStorage.getItem('gremio_pending_sync') || '[]');
        setPendingSync(pending.length);

        // Attempt sync if online
        if (navigator.onLine && pending.length > 0) {
            syncPendingItems(pending);
        }

        window.addEventListener('online', () => syncPendingItems(pending));
        return () => window.removeEventListener('online', () => { });
    }, []);

    const addCheckIn = (checkIn) => {
        const newCheckIn = {
            ...checkIn,
            trip_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'in_progress' // Default status
        };

        const updated = [...checkIns, newCheckIn];
        setCheckIns(updated);
        localStorage.setItem('gremio_checkins', JSON.stringify(updated));

        // Add to pending sync
        const currentPending = JSON.parse(localStorage.getItem('gremio_pending_sync') || '[]');
        const updatedPending = [...currentPending, newCheckIn];
        localStorage.setItem('gremio_pending_sync', JSON.stringify(updatedPending));
        setPendingSync(updatedPending.length);

        // Try to sync immediately
        if (navigator.onLine) {
            syncPendingItems(updatedPending);
        }
    };

    const syncPendingItems = async (items) => {
        if (items.length === 0) return;

        console.log(`☁️ Syncing ${items.length} check-ins to Gremio Cloud...`);

        // Simulation of API call
        setTimeout(() => {
            console.log("✅ Gremio Sync Complete.");
            localStorage.setItem('gremio_pending_sync', '[]');
            setPendingSync(0);
        }, 2000);
    };

    // ─────────────────────────────────────────────
    // SHARE URL EFÍMERA — Compartir ubicación familiar
    // ─────────────────────────────────────────────

    /**
     * Genera una URL efímera con la posición y estado actual del usuario.
     * Los datos se codifican en base64 — sin backend requerido.
     *
     * @param {{ latitude: number, longitude: number }} location
     * @param {string} [status='active'] - Estado del usuario
     * @returns {string} URL completa para compartir
     */
    const generateShareURL = (location, status = 'active') => {
        const payload = {
            lat: location?.latitude,
            lon: location?.longitude,
            status,
            ts: new Date().toISOString(),
            app: 'Territorio Jaguar',
        };

        const encoded = btoa(JSON.stringify(payload));
        const base = window.location.origin;
        return `${base}/track?d=${encoded}`;
    };

    /**
     * Comparte el check-in actual vía navigator.share o WhatsApp.
     * @param {{ latitude: number, longitude: number }} location
     * @param {string} [areaName] - Nombre del área actual
     */
    const shareCheckIn = async (location, areaName = 'Ruta Jaguar') => {
        const shareUrl = generateShareURL(location);
        const mapsUrl = location
            ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
            : '';

        const message =
            `📍 *Check-in — Territorio Jaguar*\n` +
            `Área: *${areaName}*\n` +
            `${mapsUrl ? `🗺️ Mapa: ${mapsUrl}\n` : ''}` +
            `🔗 Seguimiento: ${shareUrl}\n` +
            `_Actualizado: ${new Date().toLocaleTimeString('es-EC')}_`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Territorio Jaguar — ${areaName}`,
                    text: message,
                    url: shareUrl,
                });
                return;
            } catch (e) {
                if (e.name !== 'AbortError') console.warn('[CheckIn] Share API error:', e);
            }
        }

        // Fallback: abrir WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    };

    // ─────────────────────────────────────────────
    // RESERVA OFFLINE CON QR FIRMADO
    // ─────────────────────────────────────────────

    /**
     * Genera una reserva offline firmada con HMAC-SHA256.
     * Soporta grupos. Persiste localmente hasta recuperar señal.
     *
     * @param {string} productId    - ID del producto
     * @param {string} productName  - Nombre del producto
     * @param {string} area         - Nombre del área / comunidad
     * @param {number} [groupSize]  - Tamaño del grupo (default: 1)
     * @returns {Promise<{ token: string, expiresAt: string }>}
     */
    const reserveProduct = async (productId, productName, area, groupSize = 1) => {
        try {
            const result = await generateReservationToken({
                productId,
                productName,
                area,
                groupSize,
            });

            // También registrar como check-in local
            addCheckIn({ area, status: 'reserved', productId, groupSize });

            console.log(`[CheckInSync] ✅ Reserva QR generada para "${productName}"`);
            return result;
        } catch (err) {
            console.error('[CheckInSync] Error generando reserva QR:', err);
            return null;
        }
    };

    // ─────────────────────────────────────────────
    // CONTROL DE FRECUENCIA DE ALERTAS (8h / POI)
    // ─────────────────────────────────────────────

    const ALERT_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
    const ALERT_LOG_KEY = 'tj_poi_alert_log';

    /**
     * Verifica si se debe mostrar una alerta de proximidad para un POI.
     * Limita a 1 alerta por POI cada 8h para evitar spam.
     * @param {string} poiId
     * @returns {boolean} true si se debe mostrar la alerta
     */
    const shouldAlertForPOI = (poiId) => {
        try {
            const log = JSON.parse(localStorage.getItem(ALERT_LOG_KEY) || '{}');
            const lastAlert = log[poiId] || 0;
            return (Date.now() - lastAlert) > ALERT_TTL_MS;
        } catch {
            return true;
        }
    };

    /**
     * Registra que se mostró una alerta para un POI.
     * @param {string} poiId
     */
    const markPOIAlerted = (poiId) => {
        try {
            const log = JSON.parse(localStorage.getItem(ALERT_LOG_KEY) || '{}');
            log[poiId] = Date.now();
            localStorage.setItem(ALERT_LOG_KEY, JSON.stringify(log));
        } catch (e) {
            console.error('[CheckInSync] Error registrando alerta POI:', e);
        }
    };

    // Debug helper
    if (typeof window !== 'undefined') {
        window.__debug_shareCheckIn = (lat = -2.309, lon = -78.118) =>
            shareCheckIn({ latitude: lat, longitude: lon }, 'Macas Demo');
        window.__debug_reserveProduct = (id = '1', name = 'Demo', area = 'Upano', group = 1) =>
            reserveProduct(id, name, area, group);
    }

    return {
        checkIns,
        addCheckIn,
        pendingSync,
        generateShareURL,
        shareCheckIn,
        reserveProduct,
        shouldAlertForPOI,
        markPOIAlerted,
        getPendingReservations,
    };
};
