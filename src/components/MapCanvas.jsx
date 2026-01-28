import React, { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, Navigation, MapPin, WifiOff, Layers, Activity, Sparkles, User, Compass, Route, Radar, Target, X } from 'lucide-react';
import JIcon from './ui/JIcon';
import JaguarMarker from './ui/JaguarMarker';
import { syncService } from '../services/syncService';
import useMapRoutes from '../hooks/useMapRoutes';
import useProviders from '../hooks/useProviders';
import CustomMarker from './CustomMarker';
import useProximityAlert from '../hooks/useProximityAlert';
import ProviderMapCard from './ProviderMapCard';
import { rutaUpano } from '../data/ruta_upano'; // Importación de la ruta oficial
import { upanoArchaeology } from '../data/upano_archaeology'; // Datos Arqueológicos (LiDAR)
import ArchaeologicalCard from './map/ArchaeologicalCard';
import AncientHistoryOverlay from './map/AncientHistoryOverlay';
import FloatingSOSButton from './layout/FloatingSOSButton';
import UpanoIcon from './ui/UpanoIcon';
import useRouteTracking from '../hooks/useRouteTracking';
import useUserLocation from '../hooks/useUserLocation';
import useBatteryMonitor from '../hooks/useBatteryMonitor';
import { BatteryWarning } from 'lucide-react'; // Icono para notificación
import useMuralHunt from '../hooks/useMuralHunt';
import MuralOverlay from './ar/MuralOverlay';


const MapCanvas = () => {
    const mapRef = useRef();
    const { isLowPower } = useBatteryMonitor(); // Jaguar Shield Protocol

    // 1. Posicionamiento Real (Con Deep Canopy Filter)
    const { location: userLoc } = useUserLocation([-78.1186, -2.3087]);

    // 2. Sistema de Rutas y Navegación
    const { routes, generateRoute, clearRoutes, loading: routesLoading } = useMapRoutes();

    // Tracking de Trayectoria (Breadcrumb cada 5 min)
    const { getMovementSummary } = useRouteTracking(userLoc);

    // 3. MURAL HUNT (Ruta AR)
    const { stations, unlockedStations, nearbyStation, unlockStation } = useMuralHunt(
        userLoc ? { lat: userLoc[1], lng: userLoc[0] } : null
    );
    const [activeMural, setActiveMural] = useState(null);

    // Auto-open overlay when nearby station is detected (optional, or just show alert)
    useEffect(() => {
        if (nearbyStation) {
            setActiveMural(nearbyStation);
        }
    }, [nearbyStation]);

    // Providers Data from Firestore (con fallback local)
    const { providers: providersData, loading: providersLoading } = useProviders();
    const { nearbyProviders, activeDiscovery, closeDiscovery } = useProximityAlert(userLoc, { features: providersData }, 5000);

    // Haptic Feedback (Vibration) on Discovery
    useEffect(() => {
        if (activeDiscovery && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }, [activeDiscovery]);

    const [viewState, setViewState] = useState({
        longitude: -78.1150, // Centrado en la ruta Upano
        latitude: -2.3060,
        zoom: 14.5,
        pitch: 45 // Perspectiva táctica 3D
    });

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [simulateOffline, setSimulateOffline] = useState(false); // Estado para DEMO
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

    const [lidarMode, setLidarMode] = useState(false);
    const [selectedArcheoSite, setSelectedArcheoSite] = useState(null);
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);

    // Detección de zonas arqueológicas (Geofencing simple para demo)
    useEffect(() => {
        if (!userLoc) return;

        // Verificar si está cerca de algún sitio arqueológico (< 50m)
        const site = upanoArchaeology.features.find(f =>
            f.properties.type === 'site' &&
            Math.abs(f.geometry.coordinates[0] - userLoc[0]) < 0.0005 &&
            Math.abs(f.geometry.coordinates[1] - userLoc[1]) < 0.0005
        );

        if (site && !selectedArcheoSite) {
            // Activar modo LiDAR automáticamente al entrar
            setLidarMode(true);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic feedback
        }
    }, [userLoc]);

    // Cambiar estilo de mapa para LiDAR Mode
    useEffect(() => {
        if (lidarMode) {
            // Estilo "Blueprint/LiDAR" (Simulado con dark mode + capas cian)
            setMapStyle('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
        } else {
            setMapStyle('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
        }
    }, [lidarMode]);

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
                {/* RUTA OFICIAL: SENDERO MIRADOR DEL UPANO (Neon Trail) */}
                <Source id="upano-path" type="geojson" data={rutaUpano}>
                    {/* Capa Base: Casing/Borde (Estilo Navegante) - Desactivar blur en Low Power */}
                    <Layer
                        id="path-glow"
                        type="line"
                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                        paint={{
                            'line-color': '#1a73e8', // Darker Blue border
                            'line-width': isLowPower ? 4 : 8, // Thinner lines in power save
                            'line-opacity': isLowPower ? 1 : 0.8
                        }}
                    />
                    {/* Capa Núcleo: Línea de Navegación "Google Blue" */}
                    <Layer
                        id="path-line"
                        type="line"
                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                        paint={{
                            'line-color': '#4285F4', // Google Maps Navigation Blue
                            'line-width': 5,
                            'line-opacity': 1
                        }}
                    />
                </Source>

                {/* CAPAS ARQUEOLÓGICAS (LiDAR Mode) */}
                {lidarMode && (
                    <Source id="upano-archaeology" type="geojson" data={upanoArchaeology}>
                        {/* 1. Complejos (Polígonos) - Azul Eléctrico */}
                        <Layer
                            id="archaeo-complex-fill"
                            type="fill"
                            filter={['==', 'type', 'complex']}
                            paint={{
                                'fill-color': '#00FFFF', // Cyan LiDAR
                                'fill-opacity': 0.1
                            }}
                        />
                        <Layer
                            id="archaeo-complex-outline"
                            type="line"
                            filter={['==', 'type', 'complex']}
                            paint={{
                                'line-color': '#00FFFF',
                                'line-width': 2,
                                'line-opacity': 0.6,
                                'line-dasharray': [1, 1]
                            }}
                        />

                        {/* 2. Caminos Reales (Líneas) - Dorado Ancestral */}
                        <Layer
                            id="archaeo-roads"
                            type="line"
                            filter={['==', 'type', 'road']}
                            paint={{
                                'line-color': '#FFD700', // Gold
                                'line-width': 4,
                                'line-opacity': 0.8,
                                'line-dasharray': [2, 1] // Punteado "antiguo"
                            }}
                        />

                        {/* 3. Sitios/Templos (Puntos) */}
                        <Layer
                            id="archaeo-sites"
                            type="circle"
                            filter={['==', 'type', 'site']}
                            paint={{
                                'circle-radius': 8,
                                'circle-color': '#FFD700',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#000',
                                'circle-blur': 0.5
                            }}
                        />
                    </Source>
                )}

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
                {providersData.map(p => (
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

                {/* Marcador Inicio de Ruta Upano (Referencia) */}
                <Marker longitude={-78.1185} latitude={-2.3035} anchor="center">
                    <div className="w-4 h-4 bg-jaguar-500 rounded-full border-2 border-white shadow-[0_0_10px_#C5A059] animate-pulse"></div>
                </Marker>

                {/* MARCADORES MURALES VIVOS */}
                {stations.map(station => {
                    const isUnlocked = unlockedStations.includes(station.id);
                    return (
                        <Marker
                            key={station.id}
                            longitude={station.location.lng}
                            latitude={station.location.lat}
                            anchor="bottom"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setActiveMural(station);
                            }}
                        >
                            <div className="flex flex-col items-center group cursor-pointer">
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isUnlocked ? 'bg-jaguar-500 border-white text-black' : 'bg-black/60 border-jaguar-500 text-jaguar-500'}`}>
                                    <Sparkles size={16} className={!isUnlocked ? 'animate-pulse' : ''} />
                                </div>
                                <span className="bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {station.name}
                                </span>
                            </div>
                        </Marker>
                    );
                })}

                {/* Marcadores Arqueológicos Interactivos */}
                {lidarMode && upanoArchaeology.features.filter(f => f.properties.type === 'site').map((f, idx) => (
                    <Marker
                        key={`site-${idx}`}
                        longitude={f.geometry.coordinates[0]}
                        latitude={f.geometry.coordinates[1]}
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setSelectedArcheoSite(f.properties);
                        }}
                    >
                        <div className="relative group cursor-pointer hover:scale-110 transition-transform">
                            <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-md animate-pulse"></div>
                            <UpanoIcon size={28} className="text-amber-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                        </div>
                    </Marker>
                ))}

                {/* Controles y Overlays */}
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                    {/* Toggle LiDAR Mode */}
                    <button
                        onClick={() => setLidarMode(!lidarMode)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${lidarMode ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-jaguar-950/80 text-white/50 border-white/10'}`}
                    >
                        <Layers size={14} />
                        {lidarMode ? 'Visión LiDAR: ON' : 'Visión LiDAR'}
                    </button>

                    {/* Toggle SIMULADOR DE MODO AVIÓN (Solo para Demo) */}
                    <button
                        onClick={() => setSimulateOffline(!simulateOffline)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${simulateOffline ? 'bg-jaguar-500 text-jaguar-950 border-jaguar-400' : 'bg-black/40 text-white/30 border-white/10 hover:bg-white/10'}`}
                    >
                        {simulateOffline ? 'Demo: Modo Avión ON' : 'Demo: Modo Avión OFF'}
                    </button>

                    {(!isOnline || simulateOffline) && (
                        <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-400 animate-slide-in-left">
                            <JIcon icon={WifiOff} size={16} variant="danger" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-display font-black uppercase tracking-widest leading-none">
                                    {simulateOffline ? "Modo Jaguar: Activo" : "Sin Conexión"}
                                </span>
                                <span className="text-[8px] opacity-80 leading-tight">
                                    {simulateOffline ? "Navegando con datos satelitales locales" : "Usando mapas offline"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Notificación MODO AHORRO MJAGUAR */}
                    {isLowPower && (
                        <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/50 px-4 py-2 rounded-2xl flex items-center gap-2 text-orange-400 animate-pulse">
                            <BatteryWarning size={16} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-display font-black uppercase tracking-widest leading-none">
                                    Modo Ahorro Jaguar
                                </span>
                                <span className="text-[8px] opacity-80 leading-tight">
                                    Priorizando navegación de emergencia
                                </span>
                            </div>
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

                {/* Cards Informativas */}
                {selectedArcheoSite && (
                    <ArchaeologicalCard
                        site={selectedArcheoSite}
                        onClose={() => setSelectedArcheoSite(null)}
                        onOpenDetails={() => {
                            setSelectedArcheoSite(null);
                            setShowHistoryOverlay(true);
                        }}
                    />
                )}

                {/* OVERLAY HISTÓRICO COMPLETO */}
                {showHistoryOverlay && (
                    <AncientHistoryOverlay
                        onClose={() => setShowHistoryOverlay(false)}
                    />
                )}

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
            {/* LA NIEBLA DIGITAL: Inmersión superior e inferior */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-jaguar-950 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-jaguar-950 to-transparent pointer-events-none z-10"></div>
            {activeMural && (
                <MuralOverlay
                    station={activeMural}
                    onClose={() => setActiveMural(null)}
                    onUnlock={unlockStation}
                />
            )}
        </div>
    );
};

export default MapCanvas;
