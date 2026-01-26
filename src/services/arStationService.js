// src/services/arStationService.js
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * SERVICIO DE ESTACIONES AR - TERRITORIO JAGUAR
 * Gestión de estaciones de Realidad Aumentada y consultas a detecciones IA
 */

/**
 * Obtener la última detección de jaguar en un sector específico
 * @param {string} sectorId - ID del sector (ej: "sector_abanico")
 * @returns {Promise<Object|null>} Datos de la última detección
 */
export const getLastJaguarDetection = async (sectorId) => {
    try {
        const q = query(
            collection(db, "detecciones_ia"),
            where("sector", "==", sectorId),
            where("especie", "==", "Panthera onca"),
            orderBy("timestamp", "desc"),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const detection = querySnapshot.docs[0].data();
            return {
                id: querySnapshot.docs[0].id,
                individuoId: detection.individuoId || "Macho Adulto",
                timestamp: detection.timestamp,
                comportamiento: detection.comportamiento || "caminando",
                velocidad: detection.velocidad || "normal",
                vocalizacion: detection.vocalizacion || false,
                confianza: detection.confianza || 0.95
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching jaguar detection:", error);
        return null;
    }
};

/**
 * Verificar si el usuario está dentro del radio de activación de una estación AR
 * @param {Array} userCoords - [lng, lat] del usuario
 * @param {Array} stationCoords - [lng, lat] de la estación
 * @param {number} radiusMeters - Radio de activación en metros (default: 5)
 * @returns {boolean}
 */
export const isWithinARStationRadius = (userCoords, stationCoords, radiusMeters = 5) => {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = userCoords[1] * Math.PI / 180;
    const lat2 = stationCoords[1] * Math.PI / 180;
    const deltaLat = (stationCoords[1] - userCoords[1]) * Math.PI / 180;
    const deltaLng = (stationCoords[0] - userCoords[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
};

/**
 * Registrar interacción del usuario con una estación AR
 * @param {string} userId - ID del usuario
 * @param {string} stationId - ID de la estación
 * @param {string} action - Tipo de acción (view, photo, share)
 */
export const logARInteraction = async (userId, stationId, action) => {
    try {
        await addDoc(collection(db, "ar_interactions"), {
            userId,
            stationId,
            action,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error logging AR interaction:", error);
    }
};
