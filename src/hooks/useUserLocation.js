import { useState, useEffect } from 'react';

/**
 * Hook to get real-time geolocation of the user.
 * Falls back to a default location (Macas, Ecuador) if permission is denied.
 */
const useUserLocation = (defaultLoc = [-78.1186, -2.3087]) => {
    const [location, setLocation] = useState(defaultLoc);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation([position.coords.longitude, position.coords.latitude]);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { location, error };
};

export default useUserLocation;
