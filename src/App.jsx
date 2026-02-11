import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ArtesanoProfile from './components/ArtesanoProfile';
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
const ExplorationScreen = lazy(() => import('./components/ExplorationScreen'));
import { AuthProvider } from './context/AuthContext';
const RouteForm = lazy(() => import('./components/routes/RouteForm'));
import JaguarModeNotification from './components/ui/JaguarModeNotification';

function App() {
    return (
        <AuthProvider>
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-jaguar-950 text-white">Cargando...</div>}>
                <JaguarModeNotification />
                <Routes>
                    <Route path="/artesano/:id" element={<ArtesanoProfile />} />
                    <Route path="/crear-ruta" element={<RouteForm />} />
                    <Route path="/*" element={<MainAppContent />} />
                </Routes>
            </Suspense>
        </AuthProvider>
    );
}

function MainAppContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [showLanding, setShowLanding] = useState(true); // Nuevo estado para Landing
    const [activeTab, setActiveTab] = useState('map');
    const location = useLocation();
    const [showMigration, setShowMigration] = useState(false); // Cambiar a false después de migración
    const [showChatDemo, setShowChatDemo] = useState(true); // TEMPORAL: Para probar agentes
    const { routes, generateRoute, fetchPlacesAlongRoute, clearRoutes, loading: routesLoading } = useMapRoutes();
    const [selectedRoute, setSelectedRoute] = useState(null);

    const handleRouteSelect = async (routeData) => {
        // Si no se pasan datos (click en mapa vacío), deseleccionar
        if (!routeData) {
            setSelectedRoute(null);
            return;
        }

        const routeGeoJSON = routeData || rutaUpano.features[0]; // Fallback o uso de argumento
        const props = routeGeoJSON.properties || routeGeoJSON; // Manejo flexible de geojson vs flat object

        // 1. Mostrar detalles básicos
        setSelectedRoute({
            title: props.name,
            time: props.duration,
            dist: props.distance || 'N/A',
            level: props.difficulty,
            desc: props.description,
            affiliates: [], // Se cargarían dinámicamente
            isLoadingAffiliates: true
        });

        // Simular carga de afiliados cercanos (o implementar lógica real con Turf si tenemos geometría)
        // Por ahora, loading falso rápido
        setTimeout(() => {
            setSelectedRoute(prev => prev ? { ...prev, isLoadingAffiliates: false } : null);
        }, 1000);
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

        // Check verification in session storage to avoid repeating splash
        const hasVisited = sessionStorage.getItem('hasVisitedApp');

        if (hasVisited) {
            setIsLoading(false);
            setShowLanding(false);
        } else {
            // Simular carga de recursos (imágenes, mapas, datos offline)
            const timer = setTimeout(() => {
                setIsLoading(false);
                sessionStorage.setItem('hasVisitedApp', 'true');
            }, 3000); // 3 segundos de Branding puro
            return () => clearTimeout(timer);
        }
    }, []);

    // Effect to handle navigation from Profile
    useEffect(() => {
        if (location.state?.centerOn) {
            setActiveTab('map');
            // Logic to move map will be handled by MapCanvas watching a context or prop in a real scenario
            // For now, we assume switching to map is enough, deeper integration would require Map Context
        }
    }, [location]);

    return (
        <>
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
                                <div className="absolute inset-0 z-0">
                                    <MapCanvas onRouteSelect={handleRouteSelect} />
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
                            <ExplorationScreen onClose={() => setActiveTab('map')} />
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
        </>
    );
}

export default App;

