import * as turf from '@turf/turf';

/**
 * Bounds for Morona Santiago province (approximate)
 */
const MORONA_SANTIAGO_BOUNDS = {
    minLat: -3.85,
    maxLat: -1.6,
    minLon: -78.4,
    maxLon: -76.8
};

/**
 * Coordinates for Sevilla Don Bosco
 */
const SEVILLA_DON_BOSCO = [-78.1065, -2.3121]; // [lon, lat]

/**
 * Checks if all coordinates in a route are within the Morona Santiago province bounds.
 * @param {Array} coordinates - Array of [lon, lat] pairs.
 * @returns {boolean}
 */
export const isWithinMoronaSantiago = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return false;
    
    return coordinates.every(([lon, lat]) => {
        return (
            lat >= MORONA_SANTIAGO_BOUNDS.minLat &&
            lat <= MORONA_SANTIAGO_BOUNDS.maxLat &&
            lon >= MORONA_SANTIAGO_BOUNDS.minLon &&
            lon <= MORONA_SANTIAGO_BOUNDS.maxLon
        );
    });
};

/**
 * Checks if any point in the route is within a certain distance of Sevilla Don Bosco.
 * @param {Array} coordinates - Array of [lon, lat] pairs.
 * @param {number} radiusKm - Radius in kilometers (default 5km).
 * @returns {boolean}
 */
export const isNearSevillaDonBosco = (coordinates, radiusKm = 5) => {
    if (!coordinates || coordinates.length === 0) return false;
    
    const center = turf.point(SEVILLA_DON_BOSCO);
    
    return coordinates.some(([lon, lat]) => {
        const p = turf.point([lon, lat]);
        const distance = turf.distance(center, p, { units: 'kilometers' });
        return distance <= radiusKm;
    });
};
