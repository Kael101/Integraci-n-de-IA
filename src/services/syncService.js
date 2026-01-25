import * as turf from '@turf/turf';

/**
 * SyncService
 * Manages offline data storage and background synchronization for the Provider Panel.
 */

const STORAGE_KEY = 'jaguar_offline_data';
const SYNC_QUEUE_KEY = 'jaguar_sync_queue';
const IMAGE_CACHE_KEY = 'jaguar_image_cache'; // Key for pre-cached asset logs

export const syncService = {
    /**
     * Saves a new product/service locally
     */
    saveProductLocally: (product) => {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const newProduct = {
                ...product,
                id: Date.now(),
                status: 'pending',
                syncAt: null
            };
            data.push(newProduct);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Add to sync queue
            syncService.addToQueue({ type: 'CREATE_PRODUCT', data: newProduct });

            return newProduct;
        } catch (error) {
            console.error('Error saving locally:', error);
            throw error;
        }
    },

    /**
     * Gets all local products
     */
    getLocalProducts: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    },

    /**
     * Adds an action to the sync queue
     */
    addToQueue: (action) => {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        queue.push({ ...action, timestamp: Date.now() });
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

        // Try to sync if online
        if (navigator.onLine) {
            syncService.processQueue();
        }
    },

    /**
     * Processes the sync queue
     */
    processQueue: async () => {
        if (!navigator.onLine) return;

        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        if (queue.length === 0) return;

        console.log(`Syncing ${queue.length} items...`);

        // Mocking API calls
        for (const item of queue) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            console.log('Synced item:', item);

            if (item.type === 'CREATE_PRODUCT') {
                syncService.updateProductStatus(item.data.id, 'synced');
            }
        }

        // Clear queue after processing
        localStorage.setItem(SYNC_QUEUE_KEY, '[]');
    },

    /**
     * Updates product status in local storage
     */
    updateProductStatus: (id, status) => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updated = data.map(item =>
            item.id === id ? { ...item, status, syncAt: new Date().toISOString() } : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    /**
     * Saves map routes to local storage for offline access
     */
    saveRoutes: (routes) => {
        try {
            localStorage.setItem('jaguar_cached_routes', JSON.stringify(routes));
        } catch (error) {
            console.error('Error caching routes:', error);
        }
    },

    /**
     * Retrieves cached routes from local storage
     */
    getCachedRoutes: () => {
        return JSON.parse(localStorage.getItem('jaguar_cached_routes') || 'null');
    },

    /**
     * Saves providers list to local storage
     */
    saveProviders: (providers) => {
        try {
            localStorage.setItem('jaguar_cached_providers', JSON.stringify(providers));
        } catch (error) {
            console.error('Error caching providers:', error);
        }
    },

    /**
     * Retrieves cached providers
     */
    getCachedProviders: () => {
        return JSON.parse(localStorage.getItem('jaguar_cached_providers') || 'null');
    },

    /**
     * downloadRouteWithAssets
     * 
     * Downloads a route AND pre-caches thumbnails of providers within 1km of that route.
     * 
     * @param {Object} routeGeoJSON - Feature (LineString) of the route
     * @param {Object} providersGeoJSON - FeatureCollection of providers
     */
    downloadRouteWithAssets: async (routeGeoJSON, providersGeoJSON) => {
        if (!navigator.onLine) {
            console.warn('Cannot download assets while offline.');
            return;
        }

        console.log('Starting smart download for route assets...');

        // 1. Cache the route itself
        syncService.saveRoutes(routeGeoJSON);

        // 2. Identify providers within 1km of the route
        const nearbyProviders = providersGeoJSON.features.filter(provider => {
            const providerPoint = turf.point(provider.geometry.coordinates);
            // Use turf.booleanWithin or turf.distance to a line
            // Simplify: distance from point to line segment
            const distance = turf.pointToLineDistance(providerPoint, routeGeoJSON, { units: 'kilometers' });
            return distance <= 1.0;
        });

        console.log(`Found ${nearbyProviders.length} providers within 1km of the route. Pre-caching images...`);

        // 3. Simulate "Downloading" (Caching) thumbnails
        const imageMetadata = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}');

        for (const provider of nearbyProviders) {
            const url = provider.properties.thumbnail_url;
            if (url && !imageMetadata[url]) {
                // Mocking an actual fetch/blob storage
                // In a real PWA context, we'd add these to the Cache API
                await new Promise(resolve => setTimeout(resolve, 300));
                imageMetadata[url] = {
                    cachedAt: new Date().toISOString(),
                    size: 'mock_blob'
                };
                console.log(`Pre-cached asset: ${url}`);
            }
        }

        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageMetadata));
        console.log('Smart route download complete.');
    }
};

// Listen for online status to trigger sync
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Back online. Triggering sync...');
        syncService.processQueue();
    });
}
