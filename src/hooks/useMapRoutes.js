import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';

/**
 * Hook to manage map routes with offline fallback.
 */
const useMapRoutes = () => {
    const [routes, setRoutes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Helper to decode Google Polyline
     */
    const decodePolyline = useCallback((encoded) => {
        let poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            poly.push([lng / 1e5, lat / 1e5]);
        }
        return poly;
    }, []);

    /**
     * Function to generate a route following roads using Google Directions.
     */
    const generateRoute = useCallback(async (origin, destination) => {
        if (!origin || !destination) return;

        setLoading(true);
        setError(null);

        try {
            const apiKey = "AIzaSyALphNirilNS4Hi3frD-qNRJGey7AD_bH4";
            const originStr = `${origin[1]},${origin[0]}`;
            const destStr = `${destination[1]},${destination[0]}`;

            // Usando API de Google Directions para máxima precisión vial
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=walking&key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error(data.error_message || 'No se pudo encontrar una ruta precisa con Google Maps.');
            }

            const points = decodePolyline(data.routes[0].overview_polyline.points);

            const routeData = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: points
                    },
                    properties: {
                        name: 'Ruta Google High-Precision',
                        distance: data.routes[0].legs[0].distance.text,
                        duration: data.routes[0].legs[0].duration.text
                    }
                }]
            };

            setRoutes(routeData);
        } catch (err) {
            console.error('Google Routing error:', err);
            setError(err.message);
            // Fallback simplistic route
            setRoutes({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [origin, destination] },
                    properties: { name: 'Ruta (Directa - Fallback)' }
                }]
            });
        } finally {
            setLoading(false);
        }
    }, [decodePolyline]);

    /**
     * Fetch nearby places from Google Places API along a set of points
     */
    const fetchPlacesAlongRoute = useCallback(async (points) => {
        if (!points || points.length === 0) return [];

        try {
            const apiKey = "AIzaSyALphNirilNS4Hi3frD-qNRJGey7AD_bH4";

            // Tomamos una muestra de la ruta (Inicio, Medio, Fin) para descubrir lugares
            const samplePoints = [
                points[0],
                points[Math.floor(points.length / 2)],
                points[points.length - 1]
            ];

            let allPlaces = [];

            for (const pt of samplePoints) {
                const location = `${pt[1]},${pt[0]}`;
                const types = ['art_gallery', 'lodging', 'tourist_attraction', 'museum', 'restaurant'].join('|');
                const url = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=500&type=${types}&key=${apiKey}`;

                // Nota: Usar un proxy o backend es necesario para evadir CORS en el navegador directo
                const response = await fetch(url);
                const data = await response.json();

                if (data.status === 'OK') {
                    const mapped = data.results.map(place => ({
                        name: place.name,
                        category: mapGoogleTypeToJaguar(place.types),
                        isGoogle: true,
                        rating: place.rating
                    }));
                    allPlaces = [...allPlaces, ...mapped];
                }
            }

            // Deduplicación por nombre
            return Array.from(new Set(allPlaces.map(a => a.name)))
                .map(name => allPlaces.find(a => a.name === name));

        } catch (err) {
            console.error('Places discovery error:', err);
            return [];
        }
    }, []);

    const mapGoogleTypeToJaguar = (types) => {
        if (types.includes('art_gallery')) return 'Artesano';
        if (types.includes('lodging')) return 'Alojamiento';
        if (types.includes('restaurant')) return 'Servicio Turístico';
        if (types.includes('museum')) return 'Experiencia';
        return 'Atractivo';
    };

    const clearRoutes = () => {
        setRoutes(null);
        setError(null);
    };

    return { routes, generateRoute, fetchPlacesAlongRoute, clearRoutes, loading, error };
};

export default useMapRoutes;

