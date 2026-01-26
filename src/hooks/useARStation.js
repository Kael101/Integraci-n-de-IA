// src/hooks/useARStation.js
import { useState, useEffect } from 'react';
import { getLastJaguarDetection, isWithinARStationRadius } from '../services/arStationService';

/**
 * Hook para gestionar la lógica de una Estación AR
 * @param {string} stationId - ID de la estación
 * @param {string} sectorId - ID del sector (ej: "sector_abanico")
 * @param {Array} stationCoords - [lng, lat] de la estación
 * @param {Array} userCoords - [lng, lat] del usuario
 */
const useARStation = (stationId, sectorId, stationCoords, userCoords) => {
    const [isInRange, setIsInRange] = useState(false);
    const [detection, setDetection] = useState(null);
    const [loading, setLoading] = useState(false);

    // Verificar si el usuario está en rango
    useEffect(() => {
        if (userCoords && stationCoords) {
            const inRange = isWithinARStationRadius(userCoords, stationCoords);
            setIsInRange(inRange);
        }
    }, [userCoords, stationCoords]);

    // Cargar última detección cuando el usuario está en rango
    useEffect(() => {
        const fetchDetection = async () => {
            if (isInRange && sectorId) {
                setLoading(true);
                const data = await getLastJaguarDetection(sectorId);
                setDetection(data);
                setLoading(false);
            }
        };

        fetchDetection();
    }, [isInRange, sectorId]);

    return {
        isInRange,
        detection,
        loading,
        canActivateAR: isInRange && detection !== null
    };
};

export default useARStation;
