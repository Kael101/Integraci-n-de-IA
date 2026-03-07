// src/hooks/useFloraProximity.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { FLORA_SHUAR_WAYPOINTS } from '../data/flora_shuar_waypoints';

// Coordenadas de Macas como fallback cuando no hay GPS real
const MACAS_FALLBACK = { lat: -2.3045, lng: -78.1172 };

/**
 * Haversine Formula
 * Calcula la distancia en metros entre dos coordenadas GPS.
 */
function haversineDistance(pos1, pos2) {
    const R = 6371000; // Radio de la Tierra en metros
    const phi1 = (pos1.lat * Math.PI) / 180;
    const phi2 = (pos2.lat * Math.PI) / 180;
    const dPhi = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const dLambda = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
        Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // metros
}

/**
 * Calcula el bearing (ángulo de dirección) entre dos puntos GPS.
 * Útil para posicionar los nodos 3D en el espacio AR relativo al usuario.
 * @returns ángulo en grados [0-360], 0 = Norte
 */
function calculateBearing(from, to) {
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

/**
 * useFloraProximity
 *
 * Hook principal para el módulo de AR Flora Shuar.
 * - Observa la posición GPS del usuario en tiempo real
 * - Calcula la distancia a cada waypoint de flora
 * - Retorna los waypoints "activos" (dentro del triggerRadius)
 * - Incluye bearing para posicionar modelos 3D en la escena AR
 *
 * @param {object} options
 * @param {boolean} options.simulate - Si true, usa posición simulada para testing
 * @param {object} options.simulatedPos - { lat, lng } posición simulada
 */
export function useFloraProximity({
    simulate = false,
    simulatedPos = MACAS_FALLBACK,
} = {}) {
    const [userPos, setUserPos] = useState(null);
    const [allWaypoints, setAllWaypoints] = useState([]);
    const [nearbyWaypoints, setNearbyWaypoints] = useState([]);
    const [error, setError] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const watchIdRef = useRef(null);

    // Enriquecer waypoints con distancia y bearing desde la posición del usuario
    const enrichWaypoints = useCallback((pos) => {
        const enriched = FLORA_SHUAR_WAYPOINTS.map((wp) => {
            const distance = haversineDistance(pos, { lat: wp.lat, lng: wp.lng });
            const bearing = calculateBearing(pos, { lat: wp.lat, lng: wp.lng });
            const isActive = distance <= wp.triggerRadius;

            // Convertir bearing GPS a ángulo en espacio 3D (R3F)
            // En R3F: X = Este, Z = Norte negativo
            const bearingRad = (bearing * Math.PI) / 180;
            // Escala de visualización: mapear metros reales a unidades de escena
            const sceneScale = Math.min(distance / 20, 15); // max 15 unidades de escena
            const sceneX = Math.sin(bearingRad) * sceneScale;
            const sceneZ = -Math.cos(bearingRad) * sceneScale;

            return {
                ...wp,
                distance: Math.round(distance),
                bearing: Math.round(bearing),
                isActive,
                scene3D: { x: sceneX, y: 0, z: sceneZ },
            };
        });

        const sorted = [...enriched].sort((a, b) => a.distance - b.distance);
        setAllWaypoints(sorted);
        setNearbyWaypoints(sorted.filter((wp) => wp.isActive));
    }, []);

    useEffect(() => {
        if (simulate) {
            // Modo de prueba: usar posición simulada inmediatamente
            const pos = simulatedPos || MACAS_FALLBACK;
            setUserPos(pos);
            enrichWaypoints(pos);
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocalización no disponible en este dispositivo.');
            // Usar fallback
            setUserPos(MACAS_FALLBACK);
            enrichWaypoints(MACAS_FALLBACK);
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserPos(pos);
                setAccuracy(Math.round(position.coords.accuracy));
                setError(null);
                enrichWaypoints(pos);
            },
            (err) => {
                console.warn('[useFloraProximity] GPS error:', err.message);
                setError(`GPS no disponible: ${err.message}. Usando coordenadas de Macas.`);
                // Usar fallback en lugar de fallar
                setUserPos(MACAS_FALLBACK);
                enrichWaypoints(MACAS_FALLBACK);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [simulate, simulatedPos, enrichWaypoints]);

    return {
        userPos,
        nearbyWaypoints,
        allWaypoints,
        error,
        accuracy,
        isReady: userPos !== null,
    };
}
