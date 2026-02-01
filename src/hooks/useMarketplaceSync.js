import { useState, useEffect } from 'react';

/**
 * Hook to synchronize Marketplace data.
 * Implements Stale-While-Revalidate pattern.
 * 1. Returns cached data immediately (Stale).
 * 2. Fetches new data in the background (Revalidate).
 * 3. Updates state and cache if new data is available.
 */
export const useMarketplaceSync = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const syncData = async () => {
            // 1. Load from Cache (IndexedDB/LocalStorage) FIRST
            const cachedData = loadFromCache();
            if (cachedData) {
                setProducts(cachedData);
                setLoading(false); // Show content immediately
            }

            // 2. If online, fetch fresh data
            if (navigator.onLine) {
                try {
                    const freshData = await fetchMarketplaceData();

                    // Only update if data changed (simple length check or deep compare)
                    if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
                        setProducts(freshData);
                        saveToCache(freshData);
                        console.log("🛒 Marketplace updated from cloud.");
                    }
                } catch (error) {
                    console.warn("Failed to fetch fresh marketplace data, using cache.");
                }
            }
        };

        syncData();

        // Listen for online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            syncData(); // Trigger sync when coming back online
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { products, loading, isOnline };
};

// --- Helper Functions (Mocking IndexedDB/API) ---

const STORAGE_KEY = 'marketplace_catalog';

const loadFromCache = () => {
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Cache load error", e);
        return null;
    }
};

const saveToCache = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Cache save error", e);
    }
};

const fetchMarketplaceData = async () => {
    // Simulation of API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    id: 1,
                    name: "Jungle Protein Bites",
                    producer: "Nutrición Amazónica",
                    category: "Gastronomía",
                    price: 12.50,
                    rating: 4.9,
                    image: "https://images.unsplash.com/photo-1599599810653-98fe80fa464e?q=80&w=800&auto=format&fit=crop",
                    isNew: true,
                    tag: "Superalimento"
                },
                {
                    id: 2,
                    name: "Collar Étnico Shuar",
                    producer: "Asoc. Mujeres Artesanas",
                    category: "Artesanía",
                    price: 25.00,
                    rating: 4.8,
                    image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=800&auto=format&fit=crop",
                    isNew: false
                },
                {
                    id: 3,
                    name: "Chocolate 85% Macas",
                    producer: "Finca El Origen",
                    category: "Gastronomía",
                    price: 8.00,
                    rating: 5.0,
                    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=800&auto=format&fit=crop",
                    isNew: false
                },
                {
                    id: 4,
                    name: "Miel de Abeja Melipona",
                    producer: "Apiario Selva Viva",
                    category: "Gastronomía",
                    price: 15.00,
                    rating: 4.7,
                    image: "https://images.unsplash.com/photo-1587049359509-b788043263e8?q=80&w=800&auto=format&fit=crop",
                    isNew: false
                }
            ]);
        }, 800);
    });
};
