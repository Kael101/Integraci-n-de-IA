import { useEffect, useRef } from 'react';

/**
 * useRouteTracking
 * 
 * Background hook to track user location breadcrumbs.
 * Saves location every 5 minutes to localStorage and prunes old data (>3h).
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

            // Añadir nuevo punto
            history.push({ coords, timestamp });

            // Podar puntos antiguos (> 3 horas)
            const prunedHistory = history.filter(point => (Date.now() - point.timestamp) < HISTORY_LIMIT);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedHistory));
            console.log('Breadcrumb saved:', coords);
        } catch (error) {
            console.error('Error saving movement history:', error);
        }
    };

    /**
     * getMovementSummary
     * Returns a human-readable summary of the last known positions.
     */
    const getMovementSummary = () => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (history.length === 0) return "Sin historial previo.";

            const lastPoint = history[history.length - 1];
            const minutesAgo = Math.round((Date.now() - lastPoint.timestamp) / 60000);

            return `Historial últimas 3h: ${history.length} puntos. Último hito hace ${minutesAgo} min.`;
        } catch (e) {
            return "Error leyendo historial.";
        }
    };

    return { getMovementSummary };
};

export default useRouteTracking;
