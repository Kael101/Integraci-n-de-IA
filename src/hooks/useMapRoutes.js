import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';

/**
 * Hook to manage map routes with offline fallback.
 */
const useMapRoutes = () => {
    const [routes, setRoutes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to generate a simple straight line route (Mock for navigation)
    const generateRoute = useCallback((origin, destination) => {
        if (!origin || !destination) return;

        const routeData = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [origin, destination]
                },
                properties: { name: 'Ruta de Navegación' }
            }]
        };
        setRoutes(routeData);
    }, []);

    const clearRoutes = () => setRoutes(null);

    return { routes, generateRoute, clearRoutes, loading, error };
};

export default useMapRoutes;

