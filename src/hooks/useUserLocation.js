import { useState, useEffect, useRef } from 'react';
import useBatteryMonitor from './useBatteryMonitor';
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
    const { isLowPower } = useBatteryMonitor();

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

            // 1. Throttling por Batería (Modo Ahorro: 10s, Normal: 1s)
            const minInterval = isLowPower ? 10000 : 1000;
            if (now - lastUpdateTime.current < minInterval) return;

            // 2. Filtro de "Deep Canopy" (Ruido y Teleport)
            const dist = turf.distance(
                turf.point(prevLocation.current),
                turf.point(newCoords),
                { units: 'meters' }
            );

            // Ignorar micropasos (< 2m es ruido GPS en selva)
            if (dist < 2 && !isLowPower) return;

            // Ignorar teleport errors (> 50m/s es imposible caminando)
            if (dist > 50 && (now - lastUpdateTime.current) < 2000) return;

            // 3. Suavizado (Weighted Average para evitar saltos bruscos)
            const smoothFactor = isLowPower ? 1 : 0.7; // Si es low power, confiar mas en el dato nuevo (menos updates)
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
                enableHighAccuracy: !isLowPower, // Desactivar alta precisión en ahorro
                timeout: 20000,
                maximumAge: isLowPower ? 10000 : 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isLowPower]);

    return { location, error };
};

export default useUserLocation;
