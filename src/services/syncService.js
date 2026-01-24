/**
 * SyncService
 * Manages offline data storage and background synchronization for the Provider Panel.
 */

const STORAGE_KEY = 'jaguar_offline_data';
const SYNC_QUEUE_KEY = 'jaguar_sync_queue';

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
    }
};

// Listen for online status to trigger sync
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Back online. Triggering sync...');
        syncService.processQueue();
    });
}
