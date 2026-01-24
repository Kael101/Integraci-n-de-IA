import * as turf from '@turf/turf';

/**
 * findNearbyProviders
 * 
 * Utility to filter providers (GeoJSON) based on proximity to a user location.
 * Optimized to avoid blocking the main thread by using a non-blocking chunked approach 
 * if the dataset grows (though Turf is very fast for typical POI counts).
 * 
 * @param {Array} userLocation - [longitude, latitude]
 * @param {Object} providersGeoJSON - FeatureCollection of providers
 * @param {number} maxDistanceMeters - Radius in meters (default: 500)
 * @returns {Promise<Array>} - Promise resolving to nearby features
 */
export const findNearbyProviders = async (userLocation, providersGeoJSON, maxDistanceMeters = 500) => {
    if (!userLocation || !providersGeoJSON || !providersGeoJSON.features) return [];

    const userPoint = turf.point(userLocation);
    const nearby = [];

    // Use a Promise to allow this to run as a microtask
    return new Promise((resolve) => {
        // For very large datasets, we could chunk this with requestIdleCallback
        // For typical local provider sets (<1000), a single filter pass is < 1ms
        providersGeoJSON.features.forEach((feature) => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const providerPoint = turf.point(feature.geometry.coordinates);
                const distance = turf.distance(userPoint, providerPoint, { units: 'meters' });

                if (distance <= maxDistanceMeters) {
                    nearby.push({
                        ...feature,
                        properties: {
                            ...feature.properties,
                            distance: Math.round(distance)
                        }
                    });
                }
            }
        });

        // Sort by distance (closest first)
        nearby.sort((a, b) => a.properties.distance - b.properties.distance);

        resolve(nearby);
    });
};

/**
 * Example of how to batch this if the scale increases significantly
 */
export const findNearbyProvidersChunked = (userLocation, providers, maxDistance, callback) => {
    let index = 0;
    const chunkSize = 50;
    const nearby = [];
    const userPoint = turf.point(userLocation);

    const process = () => {
        const nextBatch = providers.slice(index, index + chunkSize);
        nextBatch.forEach(feature => {
            const distance = turf.distance(userPoint, feature, { units: 'meters' });
            if (distance <= maxDistance) nearby.push({ ...feature, distance });
        });

        index += chunkSize;
        if (index < providers.length) {
            requestIdleCallback(process);
        } else {
            callback(nearby);
        }
    };

    requestIdleCallback(process);
};
