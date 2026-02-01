import { useEffect, useState } from 'react';

/**
 * Hook to check if the application is ready for offline usage.
 * Verifies the presence of offline maps and marketplace catalog.
 */
export const useJaguarStatus = () => {
    const [isReady, setIsReady] = useState(false);
    const [status, setStatus] = useState({
        maps: false,
        catalog: false,
        checking: true
    });

    useEffect(() => {
        const checkOfflineResources = async () => {
            try {
                // 1. Check for Offline Maps
                // This is a simulation. In a real scenario, you might check IndexedDB for 'mapbox-tiles'
                // or a specific directory in the filesystem if using Capacitor Filesystem.
                const mapsLoaded = await checkOfflineMaps();

                // 2. Check for Marketplace Catalog
                // Verifying if the JSON catalog exists in LocalStorage or IndexedDB
                const catalogLoaded = await checkMarketplaceCatalog();

                setStatus({
                    maps: mapsLoaded,
                    catalog: catalogLoaded,
                    checking: false
                });

                // Consider ready if at least maps are loaded, or both depending on strict requirements
                if (mapsLoaded && catalogLoaded) {
                    setIsReady(true);
                }

            } catch (error) {
                console.error("Failed to check offline status:", error);
                setStatus(prev => ({ ...prev, checking: false }));
            }
        };

        checkOfflineResources();
    }, []);

    return { isReady, status };
};

// --- Helper Functions (Simulations) ---

const checkOfflineMaps = async () => {
    // Simulation: Check if a flag exists or if actual data counts > 0 in IDB
    // Real implementation would look like: 
    // const db = await openDB('maps-db', 1);
    // const count = await db.count('tiles');
    // return count > 0;

    // For now, we check a localStorage flag that might be set after a successful download
    const storedMapVersion = localStorage.getItem('offline_map_version');
    return !!storedMapVersion;
};

const checkMarketplaceCatalog = async () => {
    const catalog = localStorage.getItem('marketplace_catalog');
    return !!catalog && catalog.length > 0;
};
