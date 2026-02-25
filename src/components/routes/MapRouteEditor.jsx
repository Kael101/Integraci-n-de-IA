import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, X } from 'lucide-react';
import * as toGeoJSON from '@mapbox/togeojson';

const MapRouteEditor = ({ onPointsChange, onGPXUpload, initialPoints = [] }) => {
    const mapRef = useRef();
    const [viewState, setViewState] = useState({
        longitude: -78.1186,
        latitude: -2.3087,
        zoom: 13
    });
    const [markers, setMarkers] = useState(initialPoints);
    const [routeGeoJSON, setRouteGeoJSON] = useState(null);

    // Update parent when markers change
    useEffect(() => {
        onPointsChange(markers);
    }, [markers, onPointsChange]);

    const handleMapClick = useCallback((event) => {
        const { lngLat } = event;
        const newMarker = {
            id: Date.now(),
            longitude: lngLat.lng,
            latitude: lngLat.lat
        };
        setMarkers(prev => [...prev, newMarker]);
    }, []);

    const removeMarker = (id) => {
        setMarkers(prev => prev.filter(m => m.id !== id));
    };

    const handleGPXFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parser = new DOMParser();
                const gpx = parser.parseFromString(e.target.result, "text/xml");
                const geoJSON = toGeoJSON.gpx(gpx);

                setRouteGeoJSON(geoJSON);
                onGPXUpload(geoJSON);

                // Zoom to fit route
                if (geoJSON.features && geoJSON.features.length > 0) {
                    // Calculate bounds simplified
                    const coords = geoJSON.features[0].geometry.coordinates;
                    if (coords && coords.length > 0) {
                        setViewState({
                            longitude: coords[0][0],
                            latitude: coords[0][1],
                            zoom: 14
                        });
                    }
                }

            } catch (error) {
                console.error("Error parsing GPX:", error);
                alert("Error al leer el archivo GPX. Asegúrate de que sea válido.");
            }
        };
        reader.readAsText(file);
    };

    const [suggestion, setSuggestion] = useState(null);

    // ENERGY STATIONS COORDINATES (Ejemplo: Sevilla Don Bosco y Río Upano)
    const ENERGY_STATIONS = [
        { name: "Sevilla Don Bosco", lat: -2.3117, lng: -78.1144 },
        { name: "Acceso Río Upano", lat: -2.3087, lng: -78.1186 }
    ];

    // GEOFENCING & ZONES
    const MORONA_BOUNDS = {
        minLat: -3.5, maxLat: -1.5, // Aprox bounds
        minLng: -78.5, maxLng: -77.0
    };

    const RESTRICTED_ZONES = [
        { name: "Reserva Cuyabeno", lat: -0.05, lng: -76.1, radius: 0.5, message: "⚠️ Zona fuera de Morona Santiago. Redirigir a Lagunas de Sardinayacu." }
    ];

    const OFFLINE_ZONES = [
        { name: "Cueva de los Tayos", lat: -3.05, lng: -78.21, radius: 0.1, message: "📡 Señal baja detectada (Cueva de los Tayos). Se activará Modo Jaguar (Offline)." }
    ];

    // Check proximity logic
    useEffect(() => {
        if (!viewState) return;

        // 1. Sinergia Gastronómica (Jungle Protein)
        const isNearStation = ENERGY_STATIONS.find(station => {
            const dist = Math.sqrt(
                Math.pow(station.lat - viewState.latitude, 2) +
                Math.pow(station.lng - viewState.longitude, 2)
            );
            return dist < 0.005; // 500m
        });

        if (isNearStation) {
            setSuggestion({
                type: 'energy',
                text: `📍 Cerca de ${isNearStation.name}. ¿Sugerir "Punto de Nutrición" (Jungle Protein)?`,
                station: isNearStation,
                actionLabel: "AÑADIR PUNTO DE VENTA"
            });
            return;
        }

        // 2. Validación Geográfica (Alertas de Zona)
        const isRestricted = RESTRICTED_ZONES.find(zone => {
            const dist = Math.sqrt(
                Math.pow(zone.lat - viewState.latitude, 2) +
                Math.pow(zone.lng - viewState.longitude, 2)
            );
            return dist < zone.radius;
        });

        if (isRestricted) {
            setSuggestion({
                type: 'warning',
                text: isRestricted.message,
                actionLabel: "ENTENDIDO",
                isAlert: true
            });
            return;
        }

        // 3. Offline First (Cueva de los Tayos)
        const isOfflineZone = OFFLINE_ZONES.find(zone => {
            const dist = Math.sqrt(
                Math.pow(zone.lat - viewState.latitude, 2) +
                Math.pow(zone.lng - viewState.longitude, 2)
            );
            return dist < zone.radius;
        });

        if (isOfflineZone) {
            setSuggestion({
                type: 'offline',
                text: isOfflineZone.message,
                actionLabel: "ACTIVAR MODO JAGUAR",
                isInfo: true
            });
            return;
        }

        setSuggestion(null);
    }, [viewState]);

    const handleSuggestionAction = () => {
        if (!suggestion) return;

        if (suggestion.type === 'energy') {
            const newMarker = {
                id: Date.now(),
                longitude: suggestion.station.lng,
                latitude: suggestion.station.lat,
                isEnergyStation: true
            };
            setMarkers(prev => [...prev, newMarker]);
        }
        // Para warning/offline solo cerramos la sugerencia por ahora
        setSuggestion(null);
    };

    const addEnergyStation = () => {
        // Legacy fallback
        handleSuggestionAction();
    };

    return (
        <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-700 relative group">
            {/* SMART SUGGESTION OVERLAY */}
            {suggestion && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-4 animate-bounce-in max-w-[90%]
                    ${suggestion.isAlert ? 'bg-red-900/90 border-red-500 text-white' :
                        suggestion.isInfo ? 'bg-indigo-900/90 border-indigo-500 text-white' :
                            'bg-amber-500/90 border-white text-black'}
                `}>
                    <div className="flex-grow text-xs md:text-sm font-bold leading-tight">
                        {suggestion.text}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleSuggestionAction}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase hover:opacity-80 transition-opacity
                                ${suggestion.isAlert || suggestion.isInfo ? 'bg-white text-black' : 'bg-black text-amber-500'}
                            `}
                        >
                            {suggestion.actionLabel}
                        </button>
                        <button
                            onClick={() => setSuggestion(null)}
                            className="hover:opacity-70 transition-opacity p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <Map
                {...viewState}
                ref={mapRef}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                onClick={handleMapClick}
                cursor="crosshair"
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {/* Uploaded Route Layer */}
                {routeGeoJSON && (
                    <Source id="uploaded-route" type="geojson" data={routeGeoJSON}>
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                'line-color': '#00ffcc', // Cyan neon
                                'line-width': 4,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={marker.id}
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        anchor="bottom"
                        draggable
                        onDragEnd={(e) => {
                            const newMarkers = [...markers];
                            newMarkers[index] = { ...marker, longitude: e.lngLat.lng, latitude: e.lngLat.lat };
                            setMarkers(newMarkers);
                        }}
                    >
                        <div className="relative group/marker">
                            <div className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                                <MapPin size={32} fill="rgba(0,0,0,0.5)" />
                            </div>
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover/marker:opacity-100 whitespace-nowrap">
                                Punto {index + 1}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeMarker(marker.id);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover/marker:opacity-100 transition-opacity"
                            >
                                <X size={10} color="white" />
                            </button>
                        </div>
                    </Marker>
                ))}
            </Map>

            {/* GPX Upload Button Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur p-3 rounded-lg border border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors text-xs text-gray-300">
                    <input type="file" accept=".gpx" onChange={handleGPXFile} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    Subir Ruta GPX
                </label>
            </div>

            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded text-[10px] text-gray-400 pointer-events-none">
                Click en mapa para agregar puntos
            </div>
        </div>
    );
};

export default MapRouteEditor;
