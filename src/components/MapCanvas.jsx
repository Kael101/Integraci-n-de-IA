import React, { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, Navigation, MapPin, WifiOff, Layers, Activity, Sparkles, User, Compass, Route, Radar, Target } from 'lucide-react';
import JIcon from './ui/JIcon';
import JaguarMarker from './ui/JaguarMarker';
import { syncService } from '../services/syncService';
import useMapRoutes from '../hooks/useMapRoutes';
import CustomMarker from './CustomMarker';
import useProximityAlert from '../hooks/useProximityAlert';
import ProviderMapCard from './ProviderMapCard';
import mockProviders from '../data/providers.json';
import FloatingSOSButton from './layout/FloatingSOSButton';
import useRouteTracking from '../hooks/useRouteTracking';
import useUserLocation from '../hooks/useUserLocation';

const MapCanvas = () => {
    const mapRef = useRef();

    // 1. Posicionamiento Real
    const { location: userLoc } = useUserLocation([-78.1186, -2.3087]);

    // 2. Sistema de Rutas y Navegación
    const { routes, generateRoute, clearRoutes, loading: routesLoading } = useMapRoutes();

    // Tracking de Trayectoria (Breadcrumb cada 5 min)
    const { getMovementSummary } = useRouteTracking(userLoc);

    // Offline-First Providers Data
    const [providersData, setProvidersData] = useState(syncService.getCachedProviders() || mockProviders);
    const { nearbyProviders, activeDiscovery, closeDiscovery } = useProximityAlert(userLoc, providersData, 5000);

    // Haptic Feedback (Vibration) on Discovery
    useEffect(() => {
        if (activeDiscovery && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }, [activeDiscovery]);

    const [viewState, setViewState] = useState({
        longitude: userLoc[0],
        latitude: userLoc[1],
        zoom: 13,
        pitch: 45 // Perspectiva táctica
    });

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');

    // Sincronizar el centro del mapa con el usuario inicialmente o al presionar "Locate"
    useEffect(() => {
        setViewState(prev => ({
            ...prev,
            longitude: userLoc[0],
            latitude: userLoc[1]
        }));
    }, [userLoc]);

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const zoomIn = () => mapRef.current?.zoomIn();
    const zoomOut = () => mapRef.current?.zoomOut();

    const locateMe = () => {
        mapRef.current?.flyTo({
            center: userLoc,
            duration: 2000,
            zoom: 15
        });
    };

    // Función para navegar a un artesano o comercio
    const navigateToProvider = (provider) => {
        const dest = provider.geometry.coordinates;
        generateRoute(userLoc, dest);
        mapRef.current?.flyTo({
            center: [(userLoc[0] + dest[0]) / 2, (userLoc[1] + dest[1]) / 2],
            zoom: 14,
            duration: 1500
        });
    };

    return (
        <div className="relative w-full h-full bg-jaguar-950 overflow-hidden">
            <Map
                {...viewState}
                ref={mapRef}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={mapStyle}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Renderizado de Rutas de Navegación Real */}
                {routes && (
                    <Source id="jaguar-navigation" type="geojson" data={routes}>
                        <Layer
                            id="nav-line"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#C5A059',
                                'line-width': 4,
                                'line-dasharray': [2, 1], // Línea punteada táctica
                                'line-opacity': 0.9,
                                'line-blur': 1 // Un toque suave, como luz de neón
                            }}
                        />
                        <Layer
                            id="nav-glow"
                            type="line"
                            paint={{
                                'line-color': '#C5A059',
                                'line-width': 8,
                                'line-blur': 5,
                                'line-opacity': 0.3
                            }}
                        />
                    </Source>
                )}

                {/* Marcadores de Interés (Artesanos / Comercio) */}
                {mockProviders.features.map(p => (
                    <Marker
                        key={p.id}
                        longitude={p.geometry.coordinates[0]}
                        latitude={p.geometry.coordinates[1]}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            navigateToProvider(p);
                        }}
                    >
                        <CustomMarker
                            category={p.properties.category === 'Artesanía' ? 'artisan' : (p.properties.category === 'Alojamiento' ? 'lodging' : 'guide')}
                            label={p.properties.name}
                        />
                    </Marker>
                ))}

                {/* Marcador del Usuario Real: Jaguar Pulse */}
                <Marker longitude={userLoc[0]} latitude={userLoc[1]} anchor="center">
                    <JaguarMarker />
                </Marker>

                {/* Controles y Overlays */}
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                    {!isOnline && (
                        <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-400">
                            <JIcon icon={WifiOff} size={16} variant="danger" />
                            <span className="text-[10px] font-display font-black uppercase tracking-widest leading-none">Modo Supervivencia Offline</span>
                        </div>
                    )}

                    {routes && (
                        <button
                            onClick={clearRoutes}
                            className="bg-jaguar-950/80 backdrop-blur-xl border border-jaguar-500/50 px-4 py-2 rounded-2xl flex items-center gap-2 text-jaguar-500 hover:bg-jaguar-900 transition-all font-display text-[10px] font-black uppercase tracking-widest"
                        >
                            <JIcon icon={X} size={14} variant="primary" />
                            Limpiar Ruta
                        </button>
                    )}
                </div>

                <FloatingSOSButton nearbyProviders={nearbyProviders} />

                {/* Controles de Navegación Lateral */}
                <div className="absolute bottom-28 right-6 z-10 flex flex-col gap-3">
                    <button
                        onClick={zoomIn}
                        className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90"
                    >
                        <JIcon icon={Plus} size={20} variant="secondary" />
                    </button>
                    <button
                        onClick={zoomOut}
                        className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90"
                    >
                        <JIcon icon={Minus} size={20} variant="secondary" />
                    </button>
                    <div className="h-2"></div>
                    <button
                        onClick={locateMe}
                        className="w-12 h-12 bg-jaguar-500/80 backdrop-blur-xl border border-jaguar-400/30 rounded-full flex items-center justify-center text-white hover:bg-jaguar-400 transition-all shadow-xl shadow-jaguar-900/40 active:scale-90"
                    >
                        <JIcon icon={Target} size={20} variant="secondary" />
                    </button>
                </div>
            </Map>
            {/* LA NIEBLA DIGITAL: Graduado superior para integrar el mapa con la UI */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-jaguar-950 to-transparent pointer-events-none z-10"></div>
        </div>
    );
};

export default MapCanvas;


