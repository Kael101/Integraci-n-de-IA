import { useState, useEffect } from 'react';

/**
 * Hook for Deferred Synchronization of Check-Ins.
 * Stores data locally and syncs when online.
 * Follows the privacy-first JSON structure.
 */
export const useCheckInSync = () => {
    const [checkIns, setCheckIns] = useState([]);
    const [pendingSync, setPendingSync] = useState(0);

    // Mock initial data (Privacy First Structure)
    const initialData = [
        { trip_id: "uuid-1", area: "Cascada del Alto Upano", status: "completed", timestamp: "2026-02-01T09:00:00Z", latitude: -2.30, longitude: -78.12 },
        { trip_id: "uuid-2", area: "Bosque Medicinal Shuar", status: "in_progress", timestamp: "2026-02-01T10:15:00Z", latitude: -2.35, longitude: -78.05 },
        { trip_id: "uuid-3", area: "Cueva de los Tayos (Entrada)", status: "completed", timestamp: "2026-01-31T15:30:00Z", latitude: -3.05, longitude: -78.22 },
        { trip_id: "uuid-4", area: "Macas Centro", status: "completed", timestamp: "2026-02-01T08:00:00Z", latitude: -2.31, longitude: -78.11 },
        { trip_id: "uuid-5", area: "Macas Centro", status: "completed", timestamp: "2026-02-01T08:30:00Z", latitude: -2.312, longitude: -78.115 }
    ];

    useEffect(() => {
        // Load from LocalStorage
        const stored = localStorage.getItem('gremio_checkins');
        if (stored) {
            setCheckIns(JSON.parse(stored));
        } else {
            setCheckIns(initialData);
        }

        // Check for pending items to sync
        const pending = JSON.parse(localStorage.getItem('gremio_pending_sync') || '[]');
        setPendingSync(pending.length);

        // Attempt sync if online
        if (navigator.onLine && pending.length > 0) {
            syncPendingItems(pending);
        }

        window.addEventListener('online', () => syncPendingItems(pending));
        return () => window.removeEventListener('online', () => { });
    }, []);

    const addCheckIn = (checkIn) => {
        const newCheckIn = {
            ...checkIn,
            trip_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'in_progress' // Default status
        };

        const updated = [...checkIns, newCheckIn];
        setCheckIns(updated);
        localStorage.setItem('gremio_checkins', JSON.stringify(updated));

        // Add to pending sync
        const currentPending = JSON.parse(localStorage.getItem('gremio_pending_sync') || '[]');
        const updatedPending = [...currentPending, newCheckIn];
        localStorage.setItem('gremio_pending_sync', JSON.stringify(updatedPending));
        setPendingSync(updatedPending.length);

        // Try to sync immediately
        if (navigator.onLine) {
            syncPendingItems(updatedPending);
        }
    };

    const syncPendingItems = async (items) => {
        if (items.length === 0) return;

        console.log(`☁️ Syncing ${items.length} check-ins to Gremio Cloud...`);

        // Simulation of API call
        setTimeout(() => {
            console.log("✅ Gremio Sync Complete.");
            localStorage.setItem('gremio_pending_sync', '[]');
            setPendingSync(0);
        }, 2000);
    };

    return { checkIns, addCheckIn, pendingSync };
};
