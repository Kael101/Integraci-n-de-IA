import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';

/**
 * useRouteDeviation
 *
 * Monitorea en tiempo real si el usuario se ha desviado de la ruta activa.
 * Usa @turf/turf (nearestPointOnLine) para calcular la distancia exacta
 * al segmento más cercano de la ruta.
 *
 * COMPORTAMIENTO:
 *  - Compara posición del usuario contra la GeoJSON LineString de la ruta activa
 *  - Si la distancia supera el umbral (default: 15m), dispara onDeviation()
 *  - Se silencia automáticamente si el usuario regresa al corredor de ruta
 *  - Respeta el power tier: solo activo en TURBO / NORMAL
 *
 * @param {Array|null}  userCoords    - [lon, lat] posición actual del usuario
 * @param {Object|null} activeRoute   - GeoJSON FeatureCollection o Feature con LineString
 * @param {Object}      [options]
 * @param {number}      [options.thresholdMeters=15]  - Distancia de desvío para disparar alerta
 * @param {boolean}     [options.enabled=true]        - Habilitar / deshabilitar el hook
 *
 * @returns {{
 *   isDeviated: boolean,
 *   deviationMeters: number,
 *   closestPoint: Object|null,
 *   dismiss: Function,
 * }}
 */
const useRouteDeviation = (
    userCoords,
    activeRoute,
    { thresholdMeters = 15, enabled = true } = {}
) => {
    const [isDeviated, setIsDeviated] = useState(false);
    const [deviationMeters, setDeviationMeters] = useState(0);
    const [closestPoint, setClosestPoint] = useState(null);

    // Evitar alertas repetitivas mientras el usuario sigue fuera de la ruta
    const suppressUntilReturn = useRef(false);

    // Extrae la primera LineString de la ruta (acepta Feature o FeatureCollection)
    const extractLine = useCallback((route) => {
        if (!route) return null;
        if (route.type === 'Feature' && route.geometry?.type === 'LineString') {
            return route;
        }
        if (route.type === 'FeatureCollection') {
            return route.features?.find(f => f.geometry?.type === 'LineString') || null;
        }
        return null;
    }, []);

    useEffect(() => {
        if (!enabled || !userCoords || !activeRoute) {
            // Resetear estado si no hay ruta activa
            if (!activeRoute) {
                setIsDeviated(false);
                setDeviationMeters(0);
                setClosestPoint(null);
                suppressUntilReturn.current = false;
            }
            return;
        }

        const lineFeature = extractLine(activeRoute);
        if (!lineFeature) return;

        try {
            const userPoint = turf.point(userCoords); // [lon, lat]
            const nearest = turf.nearestPointOnLine(lineFeature, userPoint, { units: 'meters' });
            const distMeters = nearest.properties.dist ?? 0;

            setDeviationMeters(Math.round(distMeters));
            setClosestPoint(nearest);

            const exceeded = distMeters > thresholdMeters;

            if (exceeded && !suppressUntilReturn.current) {
                setIsDeviated(true);
                suppressUntilReturn.current = true; // No volver a alertar hasta que regrese
                console.warn(`[RouteDeviation] ⚠️ Desviado ${Math.round(distMeters)}m de la ruta activa.`);
            } else if (!exceeded && suppressUntilReturn.current) {
                // Usuario regresó al corredor → resetear
                setIsDeviated(false);
                suppressUntilReturn.current = false;
                console.log('[RouteDeviation] ✅ Usuario regresó a la ruta.');
            }
        } catch (err) {
            console.error('[RouteDeviation] Error calculando desvío:', err);
        }
    }, [userCoords, activeRoute, thresholdMeters, enabled, extractLine]);

    /** Descarta manualmente la alerta de desvío (sin mover al usuario) */
    const dismiss = useCallback(() => {
        setIsDeviated(false);
        // No resetea suppressUntilReturn para que no revuelva a alertar inmediatamente
    }, []);

    return {
        isDeviated,
        deviationMeters,
        closestPoint,
        dismiss,
    };
};

export default useRouteDeviation;
