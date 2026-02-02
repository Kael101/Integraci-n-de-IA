import React, { useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Using MapLibre as the map provider (free, open source)
// Make sure 'maplibre-gl' is installed if 'mapbox-gl' token is not available

const HeatMap = ({ checkIns = [] }) => {

    // Convert check-ins to GeoJSON
    const data = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: checkIns.map(checkIn => ({
                type: 'Feature',
                properties: {
                    id: checkIn.trip_id,
                    mag: 1 // Magnitude for heatmap weight
                },
                geometry: {
                    type: 'Point',
                    coordinates: [checkIn.longitude, checkIn.latitude]
                }
            }))
        };
    }, [checkIns]);

    // Heatmap Layer Configuration
    const heatmapLayer = {
        id: 'heatmap',
        type: 'heatmap',
        paint: {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0, 0,
                6, 1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparency color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                9, 20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 1,
                9, 0
            ]
        }
    };

    return (
        <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <Map
                initialViewState={{
                    longitude: -78.11, // Macas, Morona Santiago approx
                    latitude: -2.30,
                    zoom: 8
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://demotiles.maplibre.org/style.json" // Free style
                minZoom={5}
                maxZoom={15}
            >
                {data && (
                    <Source type="geojson" data={data}>
                        <Layer {...heatmapLayer} />
                    </Source>
                )}
            </Map>

            {/* Overlay Info */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700">
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-1">Mapa de Calor Bio-Turístico</h4>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-[10px] text-slate-400 font-bold">Alta Densidad</span>
                </div>
            </div>
        </div>
    );
};

export default HeatMap;
