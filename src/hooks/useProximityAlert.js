import { useState, useEffect, useRef } from 'react';
import { findNearbyProviders } from '../utils/proximityUtils';

/**
 * useProximityAlert
 * 
 * Hook to monitor the user's location and detect nearby providers using geofencing.
 * 
 * @param {Array} userLocation - [longitude, latitude]
 * @param {Object} providersGeoJSON - FeatureCollection of all providers
 * @param {number} checkIntervalMs - How often to check distance (default: 30s)
 * @returns {Object} - { nearbyProviders, activeDiscovery, closeDiscovery }
 */
const useProximityAlert = (userLocation, providersGeoJSON, checkIntervalMs = 30000) => {
    const [nearbyProviders, setNearbyProviders] = useState([]);
    const [activeDiscovery, setActiveDiscovery] = useState(null);
    const lastCheckLocation = useRef(null);

    useEffect(() => {
        if (!userLocation || !providersGeoJSON) return;

        const checkProximity = async () => {
            // Optimization: Only re-calculate if the user has moved significantly (e.g. 50m) 
            // implementation detail omitted for simplicity or can be added later

            const discovered = await findNearbyProviders(userLocation, providersGeoJSON, 500);
            setNearbyProviders(discovered);

            // If we find new providers we haven't alerted for in this session
            if (discovered.length > 0 && (!activeDiscovery || discovered[0].id !== activeDiscovery.id)) {
                // Trigger the first one as active discovery
                setActiveDiscovery(discovered[0]);
            }
        };

        const interval = setInterval(checkProximity, checkIntervalMs);

        // Initial check
        checkProximity();

        return () => clearInterval(interval);
    }, [userLocation, providersGeoJSON, checkIntervalMs]);

    return {
        nearbyProviders,
        activeDiscovery,
        closeDiscovery: () => setActiveDiscovery(null)
    };
};

export default useProximityAlert;
