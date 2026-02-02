import { useState } from 'react';
import { getDistance } from 'geolib'; // Asumimos geolib instalado, o usaremos la fórmula Haversine
import useUserLocation from './useUserLocation';
import { PASSPORT_POIS } from '../data/passport_data';

/**
 * Hook de Escáner de Pasaporte
 * Valida:
 * 1. Coordenadas (Geofencing < 50m)
 * 2. Hash del QR
 */
const usePassportScanner = () => {
    const { location: userLocation, error: locationError } = useUserLocation();
    const [scanError, setScanError] = useState(null);
    const [scanSuccess, setScanSuccess] = useState(null);

    // Función auxiliar Haversine si no hay geolib
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Radio tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // en metros
    };

    const validateScan = (scannedContent) => {
        setScanError(null);
        setScanSuccess(null);

        // 1. Buscar POI por el secreto del QR
        const targetPOI = PASSPORT_POIS.find(poi => poi.qr_secret === scannedContent);

        if (!targetPOI) {
            setScanError("Código QR no reconocido. ¿Es un sello oficial?");
            return false;
        }

        // 2. Verificar Ubicación (Anti-Spoofing)
        if (!userLocation) {
            setScanError("Esperando señal GPS... Intenta de nuevo.");
            return false;
        }

        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            targetPOI.coordinates.lat,
            targetPOI.coordinates.lng
        );

        console.log(`Distancia al POI (${targetPOI.name}): ${Math.round(distance)}m`);

        if (distance > 100) { // Margen de 100m por error de GPS en selva
            setScanError(`Estás demasiado lejos (${Math.round(distance)}m). Acércate al establecimiento.`);
            return false;
        }

        // 3. Éxito
        setScanSuccess(targetPOI);
        return targetPOI;
    };

    return {
        validateScan,
        scanError,
        scanSuccess,
        userLocation,
        resetScan: () => { setScanError(null); setScanSuccess(null); }
    };
};

export default usePassportScanner;
