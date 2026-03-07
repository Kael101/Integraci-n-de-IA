import { useState, useEffect, useRef } from 'react';
import { useAdaptivePowerMode, GPS_INTERVALS, POWER_TIERS } from './useAdaptivePowerMode';
import * as turf from '@turf/turf';

/**
 * Hook to get real-time geolocation of the user.
 * Features:
 * - Deep Canopy Filter: Smooths jittery GPS under trees
 * - Jaguar Power Saver: Throttles updates on low battery
 */
const useUserLocation = (defaultLoc = [-78.1186, -2.3087]) => {
    const [location, setLocation] = useState(defaultLoc);
    const [error, setError] = useState(null);
    const { powerTier, isLowPower, gpsInterval, allowHighAccuracyGPS } = useAdaptivePowerMode();

    // Filtro de Kalman simplificado (Promedio Ponderado)
    const prevLocation = useRef(defaultLoc);
    const lastUpdateTime = useRef(Date.now());

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const handlePosition = (position) => {
            const now = Date.now();
            const newCoords = [position.coords.longitude, position.coords.latitude];

            // 1. Throttling adaptivo por tier (4 niveles en vez de binario)
            if (now - lastUpdateTime.current < gpsInterval) return;

            // 2. Filtro de "Deep Canopy" (Ruido y Teleport)
            const dist = turf.distance(
                turf.point(prevLocation.current),
                turf.point(newCoords),
                { units: 'meters' }
            );

            // Ignorar micropasos (< 2m es ruido GPS en selva) — solo en modos rápidos
            if (dist < 2 && powerTier === POWER_TIERS.TURBO) return;

            // Ignorar teleport errors (> 50m/s es imposible caminando)
            if (dist > 50 && (now - lastUpdateTime.current) < 2000) return;

            // 3. Suavizado adaptivo (más suave en ECO/DEEP_SLEEP)
            const smoothFactor = isLowPower ? 1 : 0.7;
            const smoothedLoc = [
                prevLocation.current[0] * (1 - smoothFactor) + newCoords[0] * smoothFactor,
                prevLocation.current[1] * (1 - smoothFactor) + newCoords[1] * smoothFactor
            ];

            setLocation(smoothedLoc);
            prevLocation.current = smoothedLoc;
            lastUpdateTime.current = now;
        };

        const watchId = navigator.geolocation.watchPosition(
            handlePosition,
            (err) => {
                console.warn('Geolocation error:', err);
                setError(err.message);
            },
            {
                enableHighAccuracy: allowHighAccuracyGPS, // Alta precision solo en TURBO y NORMAL
                timeout: 20000,
                maximumAge: gpsInterval, // Cache GPS del sistema operativo = nuestro intervalo
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isLowPower, gpsInterval, powerTier, allowHighAccuracyGPS]);

    return { location, error };
};

export default useUserLocation;
