import { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';

/**
 * Hook to manage map routes with offline fallback.
 */
const useMapRoutes = () => {
    const [routes, setRoutes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOfflineData, setIsOfflineData] = useState(false);

    useEffect(() => {
        const fetchRoutes = async () => {
            setLoading(true);
            try {
                // Mock API Call - Replace with real endpoint later
                // Simulate network latency
                await new Promise(resolve => setTimeout(resolve, 800));

                if (!navigator.onLine) {
                    throw new Error('Offline');
                }

                // Mock Route Data (GeoJSON format)
                const mockRoutes = {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-78.125, -2.315],
                                [-78.118, -2.308],
                                [-78.112, -2.301],
                                [-78.105, -2.295]
                            ]
                        },
                        properties: { name: 'Ruta Ancestral Shuar' }
                    }]
                };

                // Success: Cache for later and update state
                syncService.saveRoutes(mockRoutes);
                setRoutes(mockRoutes);
                setIsOfflineData(false);
            } catch (err) {
                console.warn('Network error or offline. Trying syncService fallback...');
                const cached = syncService.getCachedRoutes();
                if (cached) {
                    setRoutes(cached);
                    setIsOfflineData(true);
                } else {
                    setError('No hay rutas disponibles offline.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();

        const handleOnline = () => fetchRoutes();
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return { routes, loading, error, isOfflineData };
};

export default useMapRoutes;
