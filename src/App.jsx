import React, { useState, useEffect } from 'react';
import SplashScreen from './components/ui/SplashScreen';
import BottomNav from './components/layout/BottomNav';
import MapCanvas from './components/MapCanvas';
import FloatingSOSButton from './components/layout/FloatingSOSButton';
import RouteDetailCard from './components/map/RouteDetailCard';
import ProfileView from './components/views/ProfileView';
import * as turf from '@turf/turf';
import providersData from './data/providers.json';
import { rutaUpano } from './data/ruta_upano';

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('map');
    const { routes, generateRoute, fetchPlacesAlongRoute, clearRoutes, loading: routesLoading } = useMapRoutes();
    const [selectedRoute, setSelectedRoute] = useState(null);

    const handleRouteSelect = async () => {
        const routeGeoJSON = rutaUpano.features[0];
        const points = routeGeoJSON.geometry.coordinates;

        // 1. Mostrar detalles básicos + Afiliados Locales INMEDIATAMENTE
        const localAffiliates = providersData.features.filter(provider => {
            const distance = turf.pointToLineDistance(provider, routeGeoJSON, { units: 'meters' });
            return distance < 150;
        }).map(p => ({
            name: p.properties.name,
            category: p.properties.category,
            isJaguar: true
        }));

        setSelectedRoute({
            title: routeGeoJSON.properties.name,
            time: routeGeoJSON.properties.duration,
            dist: routeGeoJSON.properties.distance,
            level: routeGeoJSON.properties.difficulty,
            desc: routeGeoJSON.properties.description,
            affiliates: localAffiliates,
            isLoadingAffiliates: true
        });

        // 2. Cargar Google Places en segundo plano sin bloquear la UI
        try {
            const googlePlaces = await fetchPlacesAlongRoute(points);

            setSelectedRoute(prev => {
                if (!prev) return null;

                const combined = [...prev.affiliates];
                googlePlaces.forEach(gp => {
                    if (!combined.find(la => la.name === gp.name)) {
                        combined.push({ ...gp, isJaguar: false });
                    }
                });

                return { ...prev, affiliates: combined, isLoadingAffiliates: false };
            });
        } catch (err) {
            console.error("Error cargando lugares extras:", err);
            setSelectedRoute(prev => prev ? { ...prev, isLoadingAffiliates: false } : null);
        }
    };

    useEffect(() => {
        // Simular carga de recursos (imágenes, mapas, datos offline)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // 3 segundos de Branding puro

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {/* Si está cargando, mostramos la Splash. Si no, la App */}
            {isLoading ? (
                <SplashScreen />
            ) : (
                <main className="relative min-h-screen bg-jaguar-950 overflow-hidden font-body">
                    {/* Vistas Condicionales */}
                    {activeTab === 'map' ? (
                        <>
                            {/* El Mapa ocupa todo el fondo de la pantalla */}
                            <div onClick={handleRouteSelect} className="absolute inset-0 z-0">
                                <MapCanvas />
                            </div>

                            {/* La Tarjeta de Detalle (Solo aparece si selectedRoute tiene datos) */}
                            {selectedRoute && (
                                <RouteDetailCard
                                    route={selectedRoute}
                                    onClose={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoute(null);
                                    }}
                                />
                            )}

                            {/* HUD de Seguridad (SOS) */}
                            <FloatingSOSButton />
                        </>
                    ) : (
                        <ProfileView />
                    )}

                    {/* Navegación Flotante */}
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </main>
            )}
        </>
    );
}

export default App;

