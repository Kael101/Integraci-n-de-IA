import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, GeolocateControl, Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { gpx as gpxToGeoJSON } from '@mapbox/togeojson';

// Servicios y Hooks del proyecto
import { getPublicHeatmapPoints, saveReport } from '../../services/sentinelReportService';
import useRouteTracking from '../../hooks/useRouteTracking';
import useUserLocation from '../../hooks/useUserLocation';
import { useTrailGamification } from '../../hooks/useTrailGamification';
import { useJaguarCoins } from '../../hooks/useJaguarCoins';
import TrailHUD from './TrailHUD';
import RiverSegmentsLayer from './RiverSegmentsLayer';
import RiverHazardPins from './RiverHazardPins';
import RiverStatusHUD from './RiverStatusHUD';
import RiverReportDialog from './RiverReportDialog';
import { subscribeToRiverStatus } from '../../services/firebase/riverReportsService';

// ─── Catálogo de senderos disponibles ─────────────────────────────────────────
// Añadir aquí nuevas rutas GPX almacenadas en /public/rutas/
const TRAIL_CATALOG = [
  {
    id: 'cascadas_copal',
    label: 'Cascadas del Copal',
    emoji: '💧',
    url: '/rutas/cascadas_copal.gpx',
    difficulty: 'Moderado',
    color: '#0ea5e9',   // azul agua
  },
  {
    id: 'mirador_sangay',
    label: 'Mirador Volcán Sangay',
    emoji: '🌋',
    url: '/rutas/mirador_sangay.gpx',
    difficulty: 'Difícil',
    color: '#f97316',   // naranja volcánico
  },
  {
    id: 'comunidad_shuar',
    label: 'Ruta Comunidad Shuar',
    emoji: '🏡',
    url: '/rutas/comunidad_shuar.gpx',
    difficulty: 'Fácil',
    color: '#a855f7',   // morado cultural
  },
];

// ─── Puntos de Canje Físico (Redemption POIs) ─────────────────────────────────
// Socios reales de la economía circular de Morona Santiago.
// Ajustar coordenadas cuando los negocios confirmen su ubicación exacta.
const REDEMPTION_POINTS = [
  {
    id: 'jung-lab',
    name: 'Jung+Lab',
    description: 'Co-working & FoodTech Lab',
    reward: 'Pase de Día + Internet Satelital',
    cost: 500,
    latitude: -2.621, longitude: -78.002,
    icon: '💻', color: '#3b82f6',
  },
  {
    id: 'jungle-protein',
    name: 'Jungle Protein Bites',
    description: 'Snacks con Ingredientes Amazónicos',
    reward: 'Pack Energético (base de Chontacuro)',
    cost: 150,
    latitude: -2.6255, longitude: -78.008,
    icon: '⚡', color: '#f59e0b',
  },
  {
    id: 'chuzos-yucas',
    name: 'Chuzos & Yucas',
    description: 'Asadero Amazónico',
    reward: 'Combo Tradicional (Chuzo + Yuca asada)',
    cost: 300,
    latitude: -2.619, longitude: -77.995,
    icon: '🍢', color: '#ef4444',
  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Centro geográfico de Morona Santiago, Ecuador */
const MORONA_SANTIAGO_CENTER = {
  longitude: -78.0048,
  latitude: -2.6233,
  zoom: 10,
  pitch: 45,   // perspectiva 3D suave para apreciar el relieve andino
  bearing: 0,
};

/**
 * Estilo base vectorial abierto — CartoDB Voyager (sin API key).
 * Reemplazar con un estilo propio en Maputnik o MapTiler cuando tengamos tiles propios.
 */
const BASE_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// ─────────────────────────────────────────────────────────────────────────────
// Estilos de Capas (MapLibre Layer Spec)  — fuera del componente para evitar
// re-renders innecesarios que recalculen useMemo en cada ciclo.
// ─────────────────────────────────────────────────────────────────────────────

const HEATMAP_LAYER_STYLE = {
  id: 'sentinel-heat',
  type: 'heatmap',
  source: 'sentinel-data',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0,   'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      1,   'rgb(178,24,43)',   // alta densidad – zona de mayor actividad
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 15, 30],
    'heatmap-opacity': 0.75,
  },
};

const ROUTE_LINE_STYLE = {
  id: 'user-route-line',
  type: 'line',
  source: 'user-route',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: {
    'line-color': '#22c55e',     // verde selva
    'line-width': 3,
    'line-opacity': 0.9,
    'line-dasharray': [2, 1],   // estilo de sendero
  },
};

const ROUTE_POINTS_STYLE = {
  id: 'user-route-points',
  type: 'circle',
  source: 'user-route-points',
  paint: {
    'circle-radius': 4,
    'circle-color': '#16a34a',
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1.5,
    'circle-opacity': 0.85,
  },
};

/**
 * Estilo de línea para senderos GPX.
 * line-width usa interpolación por zoom — equivalente a zlinear() de Guru Maps.
 * El color se inyecta dinámicamente según la ruta seleccionada.
 */
const buildTrailLayerStyle = (color = '#0ea5e9') => ({
  id: 'trail-line',
  type: 'line',
  source: 'trail-data',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: {
    'line-color': color,
    // Ancho dinámico: 2px zoom-10 → 6px zoom-15 → 10px zoom-18 (sendero de trekking)
    'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 6, 18, 10],
    'line-opacity': 0.9,
    'line-dasharray': [3, 1.5],  // patrón de sendero, análogo a "dashes: 3,1.5"
  },
});

/** Capa de puntos de waypoints extraídos del GPX */
const TRAIL_WAYPOINTS_STYLE = {
  id: 'trail-waypoints',
  type: 'circle',
  source: 'trail-waypoints',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 6],
    'circle-color': '#fff',
    'circle-stroke-color': '#0ea5e9',
    'circle-stroke-width': 2,
    'circle-opacity': 0.9,
  },
};

// ─── Helpers UI ───────────────────────────────────────────────────────────────

/** Convierte el historial de breadcrumbs en GeoJSON para renderizar en el mapa */
const buildRouteGeoJSON = (history) => {
  if (!history || history.length < 2) return null;

  const coordinates = history.map(({ coords }) => coords);

  return {
    lineString: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates },
    },
    points: {
      type: 'FeatureCollection',
      features: history.map(({ coords, timestamp }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: { time: new Date(timestamp).toLocaleTimeString('es-EC') },
      })),
    },
  };
};

/** Lee el historial de breadcrumbs directamente de localStorage */
const loadBreadcrumbHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('jaguar_movement_history') || '[]');
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TerritorioJaguarMap
 *
 * Mapa vectorial base para Morona Santiago con:
 *  - Heatmap de reportes Sentinel (privacidad diferencial ±1km)
 *  - Visualización de ruta del usuario (breadcrumbs de useRouteTracking)
 *  - Marcador live de posición del usuario (useUserLocation)
 *  - Controles de capas superpuestos (UI flotante)
 *  - Exportación GPX / GeoJSON (botones conectados a useRouteTracking)
 */
export default function TerritorioJaguarMap() {

  // ── Estado del Viewport ────────────────────────────────────────────────────
  const [viewState, setViewState] = useState(MORONA_SANTIAGO_CENTER);

  // ── Estado de Capas ────────────────────────────────────────────────────────
  const [activeLayers, setActiveLayers] = useState({
    sentinelHeatmap: false,
    userRoute: true,
    trails: false,
    rivers: true, // Nueva capa de ríos, activada por defecto para ver el demo
  });

  // ── Estado de Ríos (Base Geometries) ───────────────────────────────────────
  const [riverSegments, setRiverSegments] = useState({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[-78.01, -2.62], [-78.00, -2.63], [-77.99, -2.65]] },
        // ID cambiado para coincidir con el fallback del report dialog
        properties: { id: 'tramo_upano_01', nombre: 'Garganta del Upano', estado_navegabilidad: 'Abierto' }
      },
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[-77.99, -2.65], [-77.98, -2.67], [-77.97, -2.70]] },
        properties: { id: 'tramo_upano_02', nombre: 'Cañón Bajo', estado_navegabilidad: 'Precaución' }
      }
    ]
  });

  const [riverHazards, setRiverHazards] = useState([
    {
      id: 'h1',
      latitud: -2.63,
      longitud: -78.00,
      tipo_peligro: 'CorrienteFuerte',
      descripcion: 'Corriente inusualmente fuerte a la salida del rápido "El Sifón".',
      tiempo_transcurrido: '2h',
      usuario: 'Guía Carlos M.',
    }
  ]);

  const [showRiverReport, setShowRiverReport] = useState(false);
  const [currentRiverLevel, setCurrentRiverLevel] = useState('Normal');

  // ── Estado de Senderos GPX ─────────────────────────────────────────────────
  /** Índice del sendero activo dentro de TRAIL_CATALOG */
  const [activeTrailIdx, setActiveTrailIdx] = useState(0);
  /** GeoJSON LineString de la ruta convertida */
  const [trailGeoJSON, setTrailGeoJSON]     = useState(null);
  /** GeoJSON FeatureCollection de waypoints del GPX */
  const [waypointsGeoJSON, setWaypointsGeoJSON] = useState(null);
  /** Metadatos extraídos: nombre, descripción, etc. */
  const [trailMeta, setTrailMeta]           = useState(null);
  const [trailLoading, setTrailLoading]     = useState(false);
  const [trailError, setTrailError]         = useState(null);

  // ── Datos dinámicos ────────────────────────────────────────────────────────
  const [heatmapGeoJSON, setHeatmapGeoJSON]     = useState(null);
  const [routeHistory, setRouteHistory]          = useState([]);
  const [routeRefreshTick, setRouteRefreshTick]  = useState(0);
  /** Posición [lon, lat] del último reporte — activa el Marker de eco Sentinel */
  const [reportEcho, setReportEcho]              = useState(null);
  /** POI de canje seleccionado — muestra el Popup */
  const [selectedPOI, setSelectedPOI]            = useState(null);
  /** Feedback del último intento de canje */
  const [redeemFeedback, setRedeemFeedback]      = useState(null);

  // ── Hooks del proyecto ─────────────────────────────────────────────────────
  const { location: userLocation } = useUserLocation(
    [MORONA_SANTIAGO_CENTER.longitude, MORONA_SANTIAGO_CENTER.latitude]
  );

  // useRouteTracking recibe las coords live → guarda breadcrumbs automáticamente
  const { exportAsGPX, exportAsGeoJSON } = useRouteTracking(userLocation);

  // Coins — para recompensar reportes desde el HUD y procesar canjes POI
  const { earnCoins, spendCoins, balance: coinBalance } = useJaguarCoins();

  // ── Gamificación de sendero (Turf.js proximity + XP + Coins) ──────────────
  // Pasa coordenadas exactas — NO fuzzeadas (privacidad solo para heatmap público)
  const {
    isOnTrail,
    distanceToTrail,
    sessionStats,
    jaguarRank,
    resetSession,
  } = useTrailGamification(
    activeLayers.trails ? userLocation : null,  // desactivar análisis si la capa está apagada
    activeLayers.trails ? trailGeoJSON : null,
    { thresholdMeters: 50, xpInterval: 5 * 60 * 1000, xpAmount: 15 }
  );

  // ── Carga del Heatmap Sentinel ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeLayers.sentinelHeatmap) return;

    // getPublicHeatmapPoints() devuelve coords ya fuzzeadas ±1km (privacidad diferencial)
    const rawPoints = getPublicHeatmapPoints();

    const geojson = {
      type: 'FeatureCollection',
      features: rawPoints.map(({ id, lat, lng, category }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { id, category },
      })),
    };

    setHeatmapGeoJSON(geojson.features.length > 0 ? geojson : null);
  }, [activeLayers.sentinelHeatmap]);

  // ── Carga y parseo GPX (cliente-side, sin backend) ─────────────────────────
  useEffect(() => {
    if (!activeLayers.trails) return;

    const trail = TRAIL_CATALOG[activeTrailIdx];
    setTrailLoading(true);
    setTrailError(null);
    setTrailGeoJSON(null);
    setWaypointsGeoJSON(null);
    setTrailMeta(null);

    fetch(trail.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${trail.url}`);
        return res.text();
      })
      .then(gpxText => {
        // 1. Parsear el XML del GPX
        const parser = new DOMParser();
        const gpxDom = parser.parseFromString(gpxText, 'text/xml');

        // 2. Convertir a GeoJSON con @mapbox/togeojson
        const geojson = gpxToGeoJSON(gpxDom);

        // 3. Separar tracks (líneas) de waypoints (puntos de interés)
        const tracks    = geojson.features.filter(f => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString');
        const waypoints = geojson.features.filter(f => f.geometry?.type === 'Point');

        if (tracks.length === 0) throw new Error('GPX sin tracks de ruta.');

        // 4. Extraer metadatos del primer track
        const props = tracks[0].properties || {};
        const coordCount = tracks[0].geometry.coordinates?.length ?? 0;

        // Calcular distancia aproximada si hay coordenadas
        let distKm = null;
        if (coordCount >= 2) {
          const coords = tracks[0].geometry.coordinates;
          const toRad = d => (d * Math.PI) / 180;
          let totalM = 0;
          for (let i = 1; i < coords.length; i++) {
            const [lon1, lat1] = coords[i - 1];
            const [lon2, lat2] = coords[i];
            const R = 6371000;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            totalM += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          }
          distKm = (totalM / 1000).toFixed(1);
        }

        setTrailMeta({
          name: props.name || trail.label,
          desc: props.desc || props.description || null,
          points: coordCount,
          distKm,
          difficulty: trail.difficulty,
        });

        setTrailGeoJSON({
          type: 'FeatureCollection',
          features: tracks,
        });

        if (waypoints.length > 0) {
          setWaypointsGeoJSON({ type: 'FeatureCollection', features: waypoints });
        }

        setTrailLoading(false);
      })
      .catch(err => {
        console.error('[GPX] Error cargando sendero:', err);
        setTrailError(err.message);
        setTrailLoading(false);
      });
  }, [activeLayers.trails, activeTrailIdx]);

  // ── Lectura de la ruta breadcrumb desde localStorage ───────────────────────
  useEffect(() => {
    if (!activeLayers.userRoute) return;
    const history = loadBreadcrumbHistory();
    setRouteHistory(history);
  }, [activeLayers.userRoute, routeRefreshTick]);

  // Refresca la ruta cada 30 seg cuando la capa está activa
  useEffect(() => {
    if (!activeLayers.userRoute) return;
    const interval = setInterval(() => setRouteRefreshTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [activeLayers.userRoute]);

  // ── Datos de ruta procesados ────────────────────────────────────────────────
  const routeGeoJSON = useMemo(() => buildRouteGeoJSON(routeHistory), [routeHistory]);

  // ── Estilo de línea dinámico (cambia con el trail seleccionado) ───────────
  const trailLineStyle = useMemo(
    () => buildTrailLayerStyle(TRAIL_CATALOG[activeTrailIdx]?.color),
    [activeTrailIdx]
  );

  // Reset de sesión al cambiar de sendero
  useEffect(() => {
    resetSession();
  }, [activeTrailIdx, resetSession]);

  // ── Manejadores ────────────────────────────────────────────────────────────
  const toggleLayer = useCallback((name) => {
    setActiveLayers(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  /**
   * handleIncidentReport
   * Llamado por TrailHUD cuando el usuario selecciona una categoría de incidencia.
   * Flujo: coordenadas exactas → saveReport (fuzz+cifrado interno) → +5 Garras de Oro.
   *
   * @param {{ id: string, emoji: string, label: string }} category
   */
  const handleIncidentReport = useCallback(async (category) => {
    if (!userLocation) {
      console.warn('[Map] Reporte cancelado: sin ubicación GPS.');
      return;
    }

    // userLocation = [lon, lat] (formato [lng, lat] de Turf/MapLibre)
    const [lng, lat] = userLocation;

    try {
      // saveReport aplica internamente:
      //   1. fuzzCoordinates(lat, lng, 333) → location_public (±1km)
      //   2. encrypt(exactas) → location_exact_iv + location_exact_ciphertext
      //   3. Cola de sincronización offline-first
      await saveReport({
        category: category.id,
        location: { lat, lng },
        heading: 0,
        timestamp: new Date().toISOString(),
      });

      // +5 Garras de Oro por ciudadanía ambiental activa
      earnCoins(5, 'report', `Reporte Sentinel: ${category.label}`);

      // Eco visual sobre el mapa: aparece en las coords exactas, dura 3.5 s (3 pulsos)
      setReportEcho([lng, lat]);
      setTimeout(() => setReportEcho(null), 3500);

      console.log(
        `[Map] ✅ Reporte ${category.id} enviado.\n` +
        `  Coords exactas cifradas | Coords públicas ±1km para heatmap.`
      );
    } catch (err) {
      console.error('[Map] Error guardando reporte Sentinel:', err);
    }
  }, [userLocation, earnCoins]);

  const handleCenterOnUser = useCallback(() => {
    setViewState(v => ({
      ...v,
      longitude: userLocation[0],
      latitude: userLocation[1],
      zoom: 14,
    }));
  }, [userLocation]);

  /**
   * handleRedeem
   * Procesa un canje físico en un POI partner.
   * Usa spendCoins (FIFO, sin cap) — valida saldo antes de gastar.
   */
  const handleRedeem = useCallback((poi) => {
    const result = spendCoins(poi.cost, `${poi.reward} · ${poi.name}`);
    if (result.success) {
      setRedeemFeedback({ ok: true,  text: `✅ Canje exitoso en ${poi.name}!`, poi });
      setSelectedPOI(null);
    } else {
      setRedeemFeedback({ ok: false, text: result.reason ?? 'No fue posible canjear.', poi });
    }
    setTimeout(() => setRedeemFeedback(null), 4500);
  }, [spendCoins]);

  // ── Manejador de nuevo reporte de río ────────────────────────────────────
  const handleRiverReportSubmit = (reportData) => {
    // Si hay peligros detallados, añadir un pin
    if (reportData.peligros_reportados && userLocation) {
      const newHazard = {
        id: `h_${Date.now()}`,
        latitud: userLocation[1],
        longitud: userLocation[0],
        tipo_peligro: '⚠️', 
        descripcion: reportData.peligros_reportados,
        tiempo_transcurrido: 'Ahora',
        usuario: 'Tú',
      };
      setRiverHazards(prev => [...prev, newHazard]);
    }

    // Recompensar al usuario (+5 según diseño original)
    earnCoins(5, 'river_report', `Reporte de Río: ${reportData.nivel_agua}`);
  };

  // ── Suscripción en Tiempo Real al Estado de Ríos ───────────────────────────
  useEffect(() => {
    if (!activeLayers.rivers) return;

    // Escucha ligera solo de river_status, no del historial.
    const unsubscribe = subscribeToRiverStatus((statusMap) => {
      setRiverSegments(prev => {
        const newFeatures = prev.features.map(feature => {
          const statusEntry = statusMap[feature.properties.id];
          if (statusEntry) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                estado_navegabilidad: statusEntry.estado_navegabilidad || 'Abierto'
              }
            };
          }
          return feature;
        });
        return { ...prev, features: newFeatures };
      });

      // Actualizar el HUD principal con el tramo demo
      if (statusMap['tramo_upano_01']) {
        setCurrentRiverLevel(statusMap['tramo_upano_01'].nivel_agua || 'Normal');
      }
    });

    return () => unsubscribe();
  }, [activeLayers.rivers]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Panel de Control de Capas ─────────────────────────────────────── */}
      <div style={styles.controlPanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelIcon}>🗺️</span>
          <span style={styles.panelTitle}>Capas del Mapa</span>
        </div>

        <LayerToggle
          active={activeLayers.sentinelHeatmap}
          onToggle={() => toggleLayer('sentinelHeatmap')}
          icon="🟢"
          label="Actividad Sentinel"
          sublabel="±1km privacidad diferencial"
          color="#22c55e"
        />
        <LayerToggle
          active={activeLayers.trails}
          onToggle={() => toggleLayer('trails')}
          icon="🥾"
          label="Senderos Ecoturísticos"
          sublabel={trailLoading ? 'Cargando…' : trailMeta ? `${trailMeta.distKm ?? '?'} km · ${trailMeta.difficulty}` : 'Selecciona un sendero'}
          color={TRAIL_CATALOG[activeTrailIdx]?.color ?? '#0ea5e9'}
        />
        <LayerToggle
          active={activeLayers.rivers}
          onToggle={() => toggleLayer('rivers')}
          icon="🌊"
          label="Tramos de Río"
          sublabel="Semáforo Fluvial & Alertas"
          color="#38bdf8"
        />

        {/* Selector de sendero — visible solo cuando la capa esá activa */}
        {activeLayers.trails && (
          <div style={styles.trailSelector}>
            {TRAIL_CATALOG.map((t, i) => (
              <button
                key={t.id}
                style={{
                  ...styles.trailPill,
                  borderColor: i === activeTrailIdx ? t.color : 'rgba(255,255,255,0.15)',
                  color:       i === activeTrailIdx ? t.color : 'rgba(255,255,255,0.55)',
                  background:  i === activeTrailIdx ? `${t.color}18` : 'transparent',
                }}
                onClick={() => setActiveTrailIdx(i)}
              >
                {t.emoji} {t.label}
              </button>
            ))}
            {trailError && (
              <div style={styles.trailError}>⚠️ GPX no encontrado.<br/>Coloca el archivo en <code>/public/rutas/</code></div>
            )}
          </div>
        )}

        {/* Tarjeta de metadata del sendero activo */}
        {activeLayers.trails && trailMeta && !trailLoading && (
          <div style={styles.trailCard}>
            <div style={styles.trailCardName}>{trailMeta.name}</div>
            {trailMeta.desc && <div style={styles.trailCardDesc}>{trailMeta.desc}</div>}
            <div style={styles.trailCardStats}>
              {trailMeta.distKm && <span>📏 {trailMeta.distKm} km</span>}
              <span>📍 {trailMeta.points} pts GPS</span>
              <span>⛰️ {trailMeta.difficulty}</span>
            </div>
          </div>
        )}

        <LayerToggle
          active={activeLayers.userRoute}
          onToggle={() => toggleLayer('userRoute')}
          icon="🥾"
          label="Mi Ruta (últimas 3h)"
          sublabel={`${routeHistory.length} puntos registrados`}
          color="#16a34a"
        />

        {/* Separador */}
        <div style={styles.divider} />

        {/* Botones de Export */}
        <div style={styles.exportRow}>
          <button style={styles.exportBtn} onClick={() => exportAsGPX()}>
            ⬇️ GPX
          </button>
          <button style={styles.exportBtn} onClick={() => exportAsGeoJSON()}>
            ⬇️ GeoJSON
          </button>
        </div>

        {/* Centrar en usuario */}
        <button style={styles.centerBtn} onClick={handleCenterOnUser}>
          📍 Ir a mi posición
        </button>
      </div>

      {/* ── Badge de Privacidad ───────────────────────────────────────────── */}
      <div style={styles.privacyBadge}>
        🔒 Privacidad Diferencial Activa
      </div>

      {/* ── HUD de Ríos (Si la capa está activa) ───────────────────────── */}
      {activeLayers.rivers && (
        <RiverStatusHUD 
          tramoNombre="Río Upano (Sector Macas)"
          nivelAgua={currentRiverLevel}
          onReportSOS={() => setShowRiverReport(true)}
        />
      )}

      {/* ── HUD de Gamificación del Sendero ──────────────────────────────── */}
      {activeLayers.trails && trailGeoJSON && (
        <TrailHUD
          isOnTrail={isOnTrail}
          distanceToTrail={distanceToTrail}
          sessionStats={sessionStats}
          jaguarRank={jaguarRank}
          trailName={trailMeta?.name ?? TRAIL_CATALOG[activeTrailIdx]?.label}
          onReportIncident={handleIncidentReport}
        />
      )}

      {/* ── Mapa Principal ────────────────────────────────────────────────── */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={BASE_MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Controles nativos de navegación y geolocalización */}
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />

        {/* ── Marcador live del usuario ──────────────────────────────────── */}
        {userLocation && (
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="center"
          >
            <UserMarker />
          </Marker>
        )}

        {/* ── Capa: Heatmap Sentinel (coords fuzzeadas ±1km) ─────────────── */}
        {activeLayers.sentinelHeatmap && heatmapGeoJSON && (
          <Source id="sentinel-data" type="geojson" data={heatmapGeoJSON}>
            <Layer {...HEATMAP_LAYER_STYLE} />
          </Source>
        )}

        {/* ── Capa: LineString de la ruta del usuario ────────────────────── */}
        {activeLayers.userRoute && routeGeoJSON && (
          <>
            <Source id="user-route" type="geojson" data={routeGeoJSON.lineString}>
              <Layer {...ROUTE_LINE_STYLE} />
            </Source>
            <Source id="user-route-points" type="geojson" data={routeGeoJSON.points}>
              <Layer {...ROUTE_POINTS_STYLE} />
            </Source>
          </>
        )}

        {/* ── Capa: Senderos GPX ──────────────────────────────────────────── */}
        {activeLayers.trails && trailGeoJSON && (
          <>
            <Source id="trail-data" type="geojson" data={trailGeoJSON}>
              <Layer {...trailLineStyle} />
            </Source>
            {waypointsGeoJSON && (
              <Source id="trail-waypoints" type="geojson" data={waypointsGeoJSON}>
                <Layer {...TRAIL_WAYPOINTS_STYLE} />
              </Source>
            )}
          </>
        )}

        {/* ── Capas de Ríos: Semáforo y Pines ────────────────────────────── */}
        {activeLayers.rivers && (
          <>
            <RiverSegmentsLayer segmentsGeoJSON={riverSegments} />
            <RiverHazardPins hazards={riverHazards} />
          </>
        )}

        {/*
         * ── Espacio para capas futuras ──────────────────────────────────
         *   <Source id="artesanos" ...>  → pines de artesanos (useProviders)
         *   <Source id="flora" ...>      → alertas de flora (useFloraProximity)
         *   <Source id="murales" ...>    → mural hunt (useMuralHunt)
         *   <Source id="ar-stations" ...> → estaciones AR (useARStation)
         */}

        {/* ── Eco Sentinel ── Marcador animado post-reporte ───────────────── */}
        {reportEcho && (
          <Marker longitude={reportEcho[0]} latitude={reportEcho[1]} anchor="center">
            <div style={{ position: 'relative' }}><div className="echo-ping" /></div>
          </Marker>
        )}

        {/* ── Pines de Canje POI ──────────────────────────────────────────── */}
        {REDEMPTION_POINTS.map(poi => (
          <Marker
            key={poi.id}
            latitude={poi.latitude}
            longitude={poi.longitude}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); setSelectedPOI(poi); }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: poi.color,
              border: '2.5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19,
              boxShadow: `0 4px 12px ${poi.color}55`,
              cursor: 'pointer',
              transform: selectedPOI?.id === poi.id ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {poi.icon}
            </div>
          </Marker>
        ))}

        {/* ── Popup de canje ─────────────────────────────────────────────── */}
        {selectedPOI && (
          <Popup
            latitude={selectedPOI.latitude}
            longitude={selectedPOI.longitude}
            anchor="top"
            offset={20}
            onClose={() => setSelectedPOI(null)}
            closeOnClick={false}
            style={{ borderRadius: 14, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div style={{ padding: '12px 14px', maxWidth: 220, background: '#0f1a10' }}>
              {/* Cabecera */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{selectedPOI.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selectedPOI.color }}>{selectedPOI.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>{selectedPOI.description}</div>
                </div>
              </div>

              {/* Recompensa */}
              <div style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 9,
                padding: '8px 10px', marginBottom: 10,
              }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Recompensa</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>{selectedPOI.reward}</div>
              </div>

              {/* Balance + costo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Tu saldo</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: coinBalance >= selectedPOI.cost ? '#86efac' : '#fca5a5',
                }}>
                  {coinBalance} 🪙
                </span>
              </div>

              {/* Botón de canje */}
              <button
                onClick={() => handleRedeem(selectedPOI)}
                disabled={coinBalance < selectedPOI.cost}
                style={{
                  width: '100%', padding: '9px 0', border: 'none', borderRadius: 10,
                  background: coinBalance >= selectedPOI.cost
                    ? `linear-gradient(135deg, ${selectedPOI.color}, ${selectedPOI.color}cc)`
                    : 'rgba(255,255,255,0.08)',
                  color: coinBalance >= selectedPOI.cost ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700, fontSize: 13, cursor: coinBalance >= selectedPOI.cost ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  boxShadow: coinBalance >= selectedPOI.cost ? `0 4px 14px ${selectedPOI.color}44` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {coinBalance >= selectedPOI.cost
                  ? `Canjear · ${selectedPOI.cost} 🪙`
                  : `Faltan ${selectedPOI.cost - coinBalance} 🪙`}
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* ── Toast de resultado de canje ──────────────────────────────────── */}
      {redeemFeedback && (
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30,
          background: redeemFeedback.ok ? 'rgba(10,30,10,0.96)' : 'rgba(35,10,10,0.96)',
          border: `1px solid ${redeemFeedback.ok ? '#22c55e44' : '#ef444444'}`,
          backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '10px 20px',
          color: redeemFeedback.ok ? '#86efac' : '#fca5a5',
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {redeemFeedback.text}
        </div>
      )}

      {/* ── Dialog de Reporte de Río ─────────────────────────────────────── */}
      {showRiverReport && (
        <RiverReportDialog
          tramoId="tramo_upano_01"
          tramoNombre="Río Upano (Sector Macas)"
          onClose={() => setShowRiverReport(false)}
          onSubmit={handleRiverReportSubmit}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

/** Toggle de capa con indicador de estado */
function LayerToggle({ active, onToggle, icon, label, sublabel, color }) {
  return (
    <label style={styles.layerToggle} onClick={onToggle}>
      <div style={styles.toggleLeft}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <div style={styles.layerLabel}>{label}</div>
          <div style={styles.layerSublabel}>{sublabel}</div>
        </div>
      </div>
      <div style={{
        ...styles.togglePill,
        background: active ? color : 'rgba(255,255,255,0.15)',
      }}>
        <div style={{
          ...styles.toggleThumb,
          transform: active ? 'translateX(18px)' : 'translateX(2px)',
        }} />
      </div>
    </label>
  );
}

/** Marcador SVG animado para la posición live del usuario */
function UserMarker() {
  return (
    <div style={{ position: 'relative', width: 24, height: 24 }}>
      {/* Pulso exterior */}
      <div style={{
        position: 'absolute', inset: -8,
        background: 'rgba(34,197,94,0.25)',
        borderRadius: '50%',
        animation: 'jaguar-pulse 2s ease-in-out infinite',
      }} />
      {/* Punto central */}
      <div style={{
        width: 24, height: 24,
        background: '#22c55e',
        border: '3px solid #fff',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }} />
      <style>{`
        @keyframes jaguar-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.5); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos en objeto (compatible con SSR y sin dependencias de CSS externas)
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  controlPanel: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    background: 'rgba(10, 20, 15, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(34,197,94,0.2)',
    padding: '14px 16px',
    borderRadius: 14,
    color: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    minWidth: 230,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
  },
  panelIcon: { fontSize: 18 },
  panelTitle: {
    fontSize: 15, fontWeight: 700, letterSpacing: '0.02em', color: '#e2e8f0',
  },
  layerToggle: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, cursor: 'pointer', padding: '6px 0',
    userSelect: 'none',
  },
  toggleLeft: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  layerLabel: {
    fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3,
  },
  layerSublabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, marginTop: 1,
  },
  togglePill: {
    width: 40, height: 22, borderRadius: 11,
    position: 'relative', flexShrink: 0,
    transition: 'background 0.25s ease',
    cursor: 'pointer',
  },
  toggleThumb: {
    position: 'absolute', top: 3,
    width: 16, height: 16, borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    transition: 'transform 0.25s ease',
  },
  divider: {
    height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0',
  },
  exportRow: {
    display: 'flex', gap: 8,
  },
  exportBtn: {
    flex: 1, background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, color: '#e2e8f0',
    fontSize: 12, fontWeight: 600, padding: '7px 4px',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  centerBtn: {
    width: '100%',
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.4)',
    borderRadius: 8, color: '#86efac',
    fontSize: 12, fontWeight: 600, padding: '8px 0',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  privacyBadge: {
    position: 'absolute', bottom: 16, left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(10,20,15,0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(34,197,94,0.35)',
    color: '#86efac',
    fontSize: 11, fontWeight: 600,
    padding: '6px 14px', borderRadius: 20,
    letterSpacing: '0.04em',
    pointerEvents: 'none',
  },
  trailSelector: {
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  trailPill: {
    background: 'transparent',
    border: '1px solid',
    borderRadius: 8,
    padding: '5px 8px',
    fontSize: 11, fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trailCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 10px',
    marginTop: 2,
  },
  trailCardName: {
    fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 3,
  },
  trailCardDesc: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, lineHeight: 1.4,
  },
  trailCardStats: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
    fontSize: 10, color: '#94a3b8',
  },
  trailError: {
    fontSize: 10, color: '#f87171',
    background: 'rgba(248,113,113,0.08)',
    borderRadius: 6, padding: '5px 8px',
    lineHeight: 1.5,
  },
};
