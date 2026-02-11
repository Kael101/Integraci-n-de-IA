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

    return (
        <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-700 relative group">
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
