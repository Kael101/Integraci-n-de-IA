import React from 'react';
import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import CustomMarker from '../CustomMarker';

/**
 * ProviderMarkers
 *
 * Renderiza los marcadores de proveedores en el mapa.
 * Cuando `showHeatmap` está activo, superpone una capa heatmap
 * cuya intensidad refleja el rating del proveedor (proxy de popularidad/ventas).
 *
 * @param {Array}   providers    - GeoJSON features de proveedores
 * @param {Function} onNavigate  - Callback al hacer clic en un proveedor
 * @param {boolean} showHeatmap  - Activar/desactivar capa de mapa de calor
 */
const ProviderMarkers = ({ providers, onNavigate, showHeatmap = false }) => {
    // ── GeoJSON para la capa heatmap ──────────────────────────────────────────
    // Normalizamos el rating (1-5) a un peso 0-1 para la intensidad del heatmap.
    const heatmapGeoJSON = {
        type: 'FeatureCollection',
        features: providers.map(p => ({
            type: 'Feature',
            geometry: p.geometry,
            properties: {
                // rating 4.5–5.0 → weight 0.7–1.0  |  sin rating → 0.5
                weight: p.properties.rating
                    ? Math.max(0, (p.properties.rating - 1) / 4)
                    : 0.5,
            },
        })),
    };

    return (
        <>
            {/* ── Capa de Mapa de Calor de Ventas (POI Heatmap) ── */}
            {showHeatmap && providers.length > 0 && (
                <Source id="provider-heatmap" type="geojson" data={heatmapGeoJSON}>
                    <Layer
                        id="provider-heat"
                        type="heatmap"
                        paint={{
                            // Intensidad máxima al zoom 15
                            'heatmap-intensity': [
                                'interpolate', ['linear'], ['zoom'],
                                12, 0.6,
                                15, 1.2,
                            ],
                            // Color: verde esmeralda (frío) → ámbar → jaguar dorado (caliente)
                            'heatmap-color': [
                                'interpolate', ['linear'], ['heatmap-density'],
                                0, 'rgba(0,0,0,0)',
                                0.2, 'rgba(0,180,100,0.4)',
                                0.5, 'rgba(255,183,3,0.6)',
                                0.8, 'rgba(197,160,89,0.8)',
                                1, 'rgba(197,160,89,1)',
                            ],
                            // Radio proporcional al zoom
                            'heatmap-radius': [
                                'interpolate', ['linear'], ['zoom'],
                                12, 20,
                                15, 40,
                            ],
                            // Usar el campo weight del GeoJSON
                            'heatmap-weight': [
                                'interpolate', ['linear'], ['get', 'weight'],
                                0, 0,
                                1, 1,
                            ],
                            'heatmap-opacity': 0.7,
                        }}
                    />
                </Source>
            )}

            {/* ── Marcadores de Proveedores ── */}
            {providers.map(p => (
                <Marker
                    key={p.id}
                    longitude={p.geometry.coordinates[0]}
                    latitude={p.geometry.coordinates[1]}
                    anchor="bottom"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        onNavigate(p);
                    }}
                >
                    <CustomMarker
                        category={
                            p.properties.category === 'Artesanía' ? 'artisan' :
                                p.properties.category === 'Alojamiento' ? 'lodging' : 'guide'
                        }
                        label={p.properties.name}
                    />
                </Marker>
            ))}
        </>
    );
};

export default ProviderMarkers;

