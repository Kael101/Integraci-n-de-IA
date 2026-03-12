import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

/**
 * RiverSegmentsLayer - "El Semáforo Fluvial"
 * Renderiza los tramos de río usando un código de colores según su estado de navegabilidad.
 *
 * @param {Object} props
 * @param {Object} props.segmentsGeoJSON - GeoJSON FeatureCollection de tramos (LineStrings)
 */
export default function RiverSegmentsLayer({ segmentsGeoJSON }) {
  // Estilo dinámico basado en las propiedades del GeoJSON
  const riverStyle = useMemo(() => ({
    id: 'river-segments',
    type: 'line',
    source: 'rivers-data',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      // Ancho dinámico del río según el zoom
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 8, 18, 14],
      // Opacidad
      'line-opacity': 0.85,
      // Color según la propiedad "estado_navegabilidad" (El Semáforo)
      'line-color': [
        'match',
        ['get', 'estado_navegabilidad'],
        'Abierto', '#10b981',      // Verde (Seguro)
        'Precaución', '#f59e0b',   // Amarillo (Cuidado)
        'Cerrado', '#ef4444',      // Rojo (Peligro/Crecida)
        /* fallback */ '#3b82f6',  // Azul estándar si no hay reporte
      ],
    },
  }), []);

  // Estilo para un contorno oscuro para que resalte en el mapa
  const riverOutlineStyle = useMemo(() => ({
    id: 'river-segments-outline',
    type: 'line',
    source: 'rivers-data',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 12, 18, 20],
      'line-color': '#000000',
      'line-opacity': 0.3,
    },
  }), []);

  if (!segmentsGeoJSON) return null;

  return (
    <Source id="rivers-data" type="geojson" data={segmentsGeoJSON}>
      <Layer {...riverOutlineStyle} />
      <Layer {...riverStyle} />
    </Source>
  );
}
