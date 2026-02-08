import React, { useState, useEffect, Suspense, lazy } from 'react';
import SplashScreen from './components/ui/SplashScreen';

// Code Splitting: Lazy loading de componentes pesados
const MapCanvas = lazy(() => import('./components/MapCanvas'));
const FloatingSOSButton = lazy(() => import('./components/layout/FloatingSOSButton'));
const RouteDetailCard = lazy(() => import('./components/map/RouteDetailCard'));
const LandingPage = lazy(() => import('./components/layout/LandingPage'));
const ProfileView = lazy(() => import('./components/views/ProfileView'));
const MarketplaceView = lazy(() => import('./components/views/MarketplaceView'));
const MigrationPanel = lazy(() => import('./components/admin/MigrationPanel'));
const AgentChatDemo = lazy(() => import('./components/AgentChatDemo'));
const BottomNav = lazy(() => import('./components/layout/BottomNav'));
const PassportView = lazy(() => import('./components/passport/PassportView'));
const AstroAR = lazy(() => import('./components/ar/AstroAR'));
import { AuthProvider } from './context/AuthContext';

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [showLanding, setShowLanding] = useState(true); // Nuevo estado para Landing
    const [activeTab, setActiveTab] = useState('map');
    const [showMigration, setShowMigration] = useState(false); // Cambiar a false después de migración
    const [showChatDemo, setShowChatDemo] = useState(true); // TEMPORAL: Para probar agentes
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
        // Inicializar Servicios MCP (Mapas + Memoria)
        const initMCP = async () => {
            try {
                await mcpClient.connect({
                    'google-maps': 'ws://localhost:3000/mcp',
                    'openmemory': 'http://localhost:8080/mcp'
                });
                console.log('✅ Servicios MCP inicializados (Mapas + Memoria)');
            } catch (err) {
                console.error('Error connecting to MCP:', err);
            }
        };
        initMCP();

        // Simular carga de recursos (imágenes, mapas, datos offline)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // 3 segundos de Branding puro

        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthProvider>
            {/* Si está cargando, mostramos la Splash. Luego la Landing. Finalmente la App */}
            {isLoading ? (
                <SplashScreen />
            ) : showLanding ? (
                <Suspense fallback={null}>
                    <LandingPage onEnter={() => setShowLanding(false)} />
                </Suspense>
            ) : (
                <main className="relative min-h-screen bg-jaguar-950 overflow-hidden font-body">
                    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Cargando Territorio...</div>}>
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
                        ) : activeTab === 'profile' ? (
                            <ProfileView />
                        ) : activeTab === 'passport' ? (
                            <PassportView onClose={() => setActiveTab('map')} />
                        ) : activeTab === 'explore' ? (
                            <AstroAR onClose={() => setActiveTab('map')} />
                        ) : (
                            <MarketplaceView />
                        )}

                        {/* Navegación Flotante */}
                        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                    </Suspense>
                </main>
            )}

            {/* PANEL DE MIGRACIÓN (TEMPORAL - Solo para setup inicial) */}
            {showMigration && !isLoading && (
                <MigrationPanel onClose={() => setShowMigration(false)} />
            )}

            {/* CHAT DEMO (TEMPORAL - Para probar sistema multi-agente) */}
            {showChatDemo && !isLoading && (
                <AgentChatDemo />
            )}
        </AuthProvider>
    );
}

export default App;

