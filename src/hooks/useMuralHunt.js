import { useState, useEffect } from 'react';
import { muralesRoute } from '../data/murales_route';
import * as turf from '@turf/turf';

/**
 * Hook para gestionar la Gymkhana "Murales Vivos".
 * Maneja el desbloqueo de estaciones, progreso y persistencia.
 */
const useMuralHunt = (userLocation) => {
    const [unlockedStations, setUnlockedStations] = useState([]);
    const [nearbyStation, setNearbyStation] = useState(null);
    const [completedRoute, setCompletedRoute] = useState(false);

    // Cargar progreso inicial
    useEffect(() => {
        const savedProgress = localStorage.getItem('mural_hunt_progress');
        if (savedProgress) {
            setUnlockedStations(JSON.parse(savedProgress));
        }
    }, []);

    // Verificar proximidad a estaciones (Geofencing)
    useEffect(() => {
        if (!userLocation) return;

        const userPoint = turf.point([userLocation.lng, userLocation.lat]);

        // Buscar estación más cercana que NO esté desbloqueada (o permitir revisitar)
        // Por ahora, priorizamos encontrar cualquiera cercana para activar el trigger
        let detected = null;

        muralesRoute.forEach(station => {
            const stationPoint = turf.point([station.location.lng, station.location.lat]);
            const distance = turf.distance(userPoint, stationPoint, { units: 'meters' });

            if (distance <= station.triggerRadius) {
                detected = station;
            }
        });

        // Solo notificar si cambiamos de estado (para evitar loops)
        if (detected && (!nearbyStation || nearbyStation.id !== detected.id)) {
            setNearbyStation(detected);

            // Haptic Feedback simulado
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate([200, 100, 200]);
            }
        } else if (!detected && nearbyStation) {
            setNearbyStation(null);
        }

    }, [userLocation, nearbyStation]);

    // Desbloquear una estación
    const unlockStation = (stationId) => {
        if (!unlockedStations.includes(stationId)) {
            const newProgress = [...unlockedStations, stationId];
            setUnlockedStations(newProgress);
            localStorage.setItem('mural_hunt_progress', JSON.stringify(newProgress));

            // Verificar si completó la ruta
            if (newProgress.length === muralesRoute.length) {
                setCompletedRoute(true);
            }
        }
    };

    return {
        stations: muralesRoute,
        unlockedStations,
        nearbyStation,     // La estación activa actual (si estás cerca)
        completedRoute,
        unlockStation,
        progress: Math.round((unlockedStations.length / muralesRoute.length) * 100)
    };
};

export default useMuralHunt;
