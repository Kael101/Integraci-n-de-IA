import React, { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Plus, Minus, Navigation, MapPin, WifiOff, Layers, Activity, Sparkles, User } from 'lucide-react';
import { syncService } from '../services/syncService';
import useMapRoutes from '../hooks/useMapRoutes';
import CustomMarker from './CustomMarker';
import useProximityAlert from '../hooks/useProximityAlert';
import ProviderMapCard from './ProviderMapCard';
import mockProviders from '../data/providers.json';

// IMPORTANTE: El token de Mapbox debe ser proporcionado por el usuario o configurado en .env
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFndWFyLWFkbWluIiwiYSI6ImNsc3R4Z2p4ZTAxenMya3BlMnl4eGZ3YmlifQ.placeholder';

const MapCanvas = () => {
    const mapRef = useRef();
    const { routes, loading: routesLoading, error: routesError, isOfflineData: isRoutesOffline } = useMapRoutes();

    // User location state for proximity (simulated)
    const [userLoc, setUserLoc] = useState([-78.1186, -2.3087]);
    const { nearbyProviders, activeDiscovery, closeDiscovery } = useProximityAlert(userLoc, mockProviders, 5000);

    const [viewState, setViewState] = useState({
        longitude: userLoc[0],
        latitude: userLoc[1],
        zoom: 13
    });
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');

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
        navigator.geolocation.getCurrentPosition((pos) => {
            mapRef.current?.flyTo({
                center: [pos.coords.longitude, pos.coords.latitude],
                duration: 2000
            });
        });
    };

    return (
        <div className="relative w-full h-full min-h-[500px] bg-slate-900 overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/5">
            <Map
                {...viewState}
                ref={mapRef}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={mapStyle}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Renderizado de Rutas (GeoJSON Polyline) */}
                {routes && (
                    <Source id="jaguar-routes" type="geojson" data={routes}>
                        <Layer
                            id="route-line"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#10b981', // emerald-500
                                'line-width': 6,
                                'line-opacity': 0.8
                            }}
                        />
                        <Layer
                            id="route-glow"
                            type="line"
                            paint={{
                                'line-color': '#10b981',
                                'line-width': 12,
                                'line-blur': 10,
                                'line-opacity': 0.4
                            }}
                        />
                    </Source>
                )}

                {/* Marcadores de Interés (POIs) */}
                <Marker longitude={-78.1186} latitude={-2.3087} anchor="bottom">
                    <CustomMarker type="jaguar" label="Avistamiento A-12" />
                </Marker>

                <Marker longitude={-78.105} latitude={-2.295} anchor="bottom">
                    <CustomMarker type="campamento" label="Base Sector Abanico" />
                </Marker>

                <Marker longitude={-78.125} latitude={-2.32} anchor="bottom">
                    <CustomMarker type="default" label="Punto de Control" />
                </Marker>

                {/* Marcadores de Proveedores Cercanos */}
                {mockProviders.features.map(p => (
                    <Marker key={p.id} longitude={p.geometry.coordinates[0]} latitude={p.geometry.coordinates[1]} anchor="bottom">
                        <CustomMarker type="default" label={p.properties.name} />
                    </Marker>
                ))}

                {/* Marcador del Usuario (Simulado) */}
                <Marker longitude={userLoc[0]} latitude={userLoc[1]} anchor="center">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
                        <div className="bg-blue-600 p-2 rounded-full text-white shadow-lg border-2 border-white ring-4 ring-blue-500/20">
                            <User size={16} />
                        </div>
                    </div>
                </Marker>

                {/* Descubrimiento: Provider Card */}
                {activeDiscovery && (
                    <ProviderMapCard
                        provider={activeDiscovery}
                        onClose={closeDiscovery}
                        onOpenDetails={(p) => alert(`Abriendo detalles de: ${p.properties.name}`)}
                    />
                )}

                {/* Overlay de Estado */}
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                    {(!isOnline || isRoutesOffline) && (
                        <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-400 animate-in slide-in-from-left duration-500">
                            <WifiOff size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Datos de Ruta Offline (Caché)</span>
                        </div>
                    )}
                    {routesLoading && (
                        <div className="bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-blue-400">
                            <Activity size={16} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sincronizando Rutas...</span>
                        </div>
                    )}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 text-white/70">
                        <Layers size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Capa: Corredor Biológico</span>
                    </div>

                    {/* Botón de Simulación de Movimiento */}
                    <button
                        onClick={() => setUserLoc([-78.118, -2.310])}
                        className="bg-blue-600/80 backdrop-blur-xl border border-blue-400/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-white hover:bg-blue-500 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                    >
                        Simular Acercamiento a Artesano
                    </button>
                </div>

                {/* Controles Glassmorphism Personalizados */}
                <div className="absolute bottom-10 right-10 z-10 flex flex-col gap-3">
                    <button
                        onClick={zoomIn}
                        className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl active:scale-90"
                    >
                        <Plus size={24} />
                    </button>
                    <button
                        onClick={zoomOut}
                        className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl active:scale-90"
                    >
                        <Minus size={24} />
                    </button>
                    <div className="h-2"></div>
                    <button
                        onClick={locateMe}
                        className="w-14 h-14 bg-emerald-600/80 backdrop-blur-xl border border-emerald-400/30 rounded-full flex items-center justify-center text-white hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/40 active:scale-90"
                    >
                        <Navigation size={24} />
                    </button>
                </div>
            </Map>
        </div>
    );
};

export default MapCanvas;
