// src/hooks/useProviders.js
import { useState, useEffect } from 'react';
import { getAllProviders } from '../services/firestoreService';
import mockProviders from '../data/providers.json';

/**
 * Hook para obtener la lista de socios desde Firestore
 * Con fallback a datos locales en caso de error
 */
const useProviders = () => {
    const [providers, setProviders] = useState(mockProviders.features);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                setLoading(true);
                const firestoreProviders = await getAllProviders();

                if (firestoreProviders.length > 0) {
                    // Convertir formato Firestore a GeoJSON
                    const geoJsonProviders = firestoreProviders.map(provider => ({
                        id: provider.id,
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [provider.coordinates.lng, provider.coordinates.lat]
                        },
                        properties: {
                            name: provider.name,
                            category: provider.category,
                            thumbnail: provider.thumbnail,
                            rating: provider.rating
                        }
                    }));

                    setProviders(geoJsonProviders);
                    console.log("✅ Providers cargados desde Firestore:", geoJsonProviders.length);
                } else {
                    console.warn("⚠️ No hay datos en Firestore, usando datos locales");
                }

            } catch (err) {
                console.error("❌ Error fetching providers:", err);
                setError(err);
                // Mantener datos locales en caso de error
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
    }, []);

    return { providers, loading, error };
};

export default useProviders;
