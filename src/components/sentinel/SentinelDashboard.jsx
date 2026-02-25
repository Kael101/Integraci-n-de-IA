import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getReportsSummary } from '../../services/sentinelReportService';
import { BarChart2, RefreshCw, ShieldCheck, AlertTriangle, Droplets, TreePine } from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const CATEGORY_META = {
    deforestation: { icon: <TreePine className="w-4 h-4" />, label: 'Tala', color: '#22c55e', bg: 'bg-green-500/20 text-green-300' },
    machinery: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Maquinaria', color: '#f97316', bg: 'bg-orange-500/20 text-orange-300' },
    water_pollution: { icon: <Droplets className="w-4 h-4" />, label: 'Contaminación', color: '#3b82f6', bg: 'bg-blue-500/20 text-blue-300' }
};

const DEMO_REPORTS = [
    { id: 'DEMO-001', category: 'deforestation', status: 'synced', createdAt: '2026-02-20T14:30:00Z', location: { lat: -2.3042, lng: -78.1198 } },
    { id: 'DEMO-002', category: 'machinery', status: 'synced', createdAt: '2026-02-21T09:15:00Z', location: { lat: -2.3612, lng: -78.0987 } },
    { id: 'DEMO-003', category: 'water_pollution', status: 'pending', createdAt: '2026-02-22T16:45:00Z', location: { lat: -2.2876, lng: -78.1543 } },
    { id: 'DEMO-004', category: 'deforestation', status: 'synced', createdAt: '2026-02-23T11:00:00Z', location: { lat: -2.4231, lng: -78.0756 } },
    { id: 'DEMO-005', category: 'machinery', status: 'pending', createdAt: '2026-02-24T08:30:00Z', location: { lat: -2.3189, lng: -78.2001 } },
    { id: 'DEMO-006', category: 'deforestation', status: 'synced', createdAt: '2026-02-25T07:00:00Z', location: { lat: -2.3901, lng: -78.1334 } },
];

// GeoJSON para el heatmap (solo puntos de los reportes demo)
const heatmapGeoJSON = {
    type: 'FeatureCollection',
    features: DEMO_REPORTS.map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.location.lng, r.location.lat] },
        properties: { category: r.category }
    }))
};

// Estilos de capas del heatmap
const heatmapLayerStyle = {
    id: 'sentinel-heatmap',
    type: 'heatmap',
    maxzoom: 15,
    paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 15, 60],
        'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(16,185,129,0.4)',
            0.5, 'rgba(234,179,8,0.7)',
            0.8, 'rgba(249,115,22,0.9)',
            1, 'rgba(239,68,68,1)'
        ],
        'heatmap-opacity': 0.85
    }
};

/**
 * SentinelDashboard
 * Panel de verificación admin — heatmap Maplibre + tabla de reportes.
 * Ruta: /sentinel-admin
 * Sin dependencias de API key — usa CartoCDN dark style (igual que MapCanvas.jsx)
 */
const SentinelDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewState, setViewState] = useState({
        longitude: -78.1198,
        latitude: -2.3042,
        zoom: 9.5
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const local = getReportsSummary();
                setReports([...DEMO_REPORTS, ...local]);
            } catch {
                setReports(DEMO_REPORTS);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = selectedCategory === 'all'
        ? reports
        : reports.filter(r => r.category === selectedCategory);

    const stats = {
        total: reports.length,
        synced: reports.filter(r => r.status === 'synced').length,
        pending: reports.filter(r => r.status === 'pending').length,
    };

    return (
        <div className="min-h-screen bg-jaguar-950 text-white">
            {/* Header */}
            <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="font-black uppercase italic text-white text-lg leading-tight">
                            Dashboard Centinela
                        </h1>
                        <p className="text-[10px] text-white/40 font-medium">Panel de Verificación — Morona Santiago</p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 p-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-white' },
                    { label: 'Verificados', value: stats.synced, color: 'text-emerald-400' },
                    { label: 'Pendientes', value: stats.pending, color: 'text-yellow-400' }
                ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Heatmap — react-map-gl/maplibre (sin API key) */}
            <div className="mx-4 mb-4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '320px' }}>
                <Map
                    {...viewState}
                    onMove={e => setViewState(e.viewState)}
                    mapStyle={MAP_STYLE}
                    style={{ width: '100%', height: '100%' }}
                >
                    <NavigationControl position="bottom-right" />

                    {/* Capa Heatmap */}
                    <Source id="sentinel-reports" type="geojson" data={heatmapGeoJSON}>
                        <Layer {...heatmapLayerStyle} />
                    </Source>

                    {/* Marcadores individuales coloreados por categoría */}
                    {DEMO_REPORTS.map(r => (
                        <Marker
                            key={r.id}
                            longitude={r.location.lng}
                            latitude={r.location.lat}
                            anchor="center"
                        >
                            <div
                                title={CATEGORY_META[r.category]?.label || r.category}
                                style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: CATEGORY_META[r.category]?.color || '#fff',
                                    border: '2px solid rgba(255,255,255,0.6)',
                                    boxShadow: `0 0 8px ${CATEGORY_META[r.category]?.color || '#fff'}`
                                }}
                            />
                        </Marker>
                    ))}
                </Map>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1 no-scrollbar">
                {['all', 'deforestation', 'machinery', 'water_pollution'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat
                                ? 'bg-emerald-500 text-jaguar-950'
                                : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'
                            }`}
                    >
                        {cat === 'all' ? 'Todos' : CATEGORY_META[cat]?.label}
                    </button>
                ))}
            </div>

            {/* Tabla de reportes */}
            <div className="px-4 pb-8 space-y-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" />
                    Reportes ({filtered.length})
                </h2>

                {loading && <div className="text-center py-8 text-white/30 text-sm">Cargando reportes...</div>}

                {!loading && filtered.map(r => {
                    const cat = CATEGORY_META[r.category];
                    return (
                        <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat?.bg || 'bg-white/10 text-white/50'}`}>
                                {cat?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[12px] text-white truncate">{cat?.label || r.category}</p>
                                <p className="text-[10px] text-white/40 font-mono">
                                    {r.id} · {new Date(r.createdAt).toLocaleDateString('es-EC')}
                                </p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${r.status === 'synced'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {r.status === 'synced' ? 'Enviado' : 'Pendiente'}
                            </span>
                        </div>
                    );
                })}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-10 text-white/30 text-sm">
                        No hay reportes en esta categoría.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SentinelDashboard;
