// src/components/map/PredictiveSyncPanel.jsx
/**
 * PREDICTIVE SYNC PANEL
 * Widget de estado del sistema predictivo offline + batería.
 * Diseñado para mostrarse sobre el mapa sin ser intrusivo.
 */

import React, { useState } from 'react';
import { Database, Zap, Wifi, WifiOff, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { usePredictiveSync } from '../../hooks/usePredictiveSync';
import { POWER_TIERS, TIER_CONFIG } from '../../hooks/useAdaptivePowerMode';

/** Formatea milisegundos a texto legible */
function formatLastSync(date) {
    if (!date) return 'Nunca';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Ahora mismo';
    if (mins === 1) return 'Hace 1 min';
    if (mins < 60) return `Hace ${mins} min`;
    return `Hace ${Math.floor(mins / 60)}h`;
}

/** Dot de estado con pulso */
const StatusDot = ({ color, pulse = false }) => (
    <span
        className={`inline-block w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
);

export default function PredictiveSyncPanel({ providers }) {
    const [expanded, setExpanded] = useState(false);

    const {
        powerTier,
        batteryLevel,
        isCharging,
        tierConfig,
        cacheStats,
        isSyncing,
        lastSyncTime,
        batterySavedEstimate,
        predictedRoutesReady,
        manualPrefetch,
    } = usePredictiveSync({ providers });

    const isOnline = navigator.onLine;
    const cfg = TIER_CONFIG[powerTier] || tierConfig;

    return (
        <div
            className="absolute bottom-36 left-4 z-20 select-none"
            style={{ maxWidth: '220px' }}
        >
            {/* ── Pill Compacta (siempre visible) ── */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 w-full text-left transition-all active:scale-95"
                style={{
                    background: 'rgba(5,15,10,0.85)',
                    backdropFilter: 'blur(14px)',
                    borderColor: `${cfg?.color || '#40916C'}30`,
                }}
            >
                {/* Tier icon */}
                <span className="text-sm">{cfg?.icon || '🌿'}</span>

                {/* Tier label + battery */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <StatusDot
                            color={cfg?.color || '#40916C'}
                            pulse={isSyncing || powerTier === POWER_TIERS.TURBO}
                        />
                        <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{ color: cfg?.color || '#40916C' }}
                        >
                            {cfg?.label || powerTier}
                        </span>
                        {isCharging && <span className="text-[8px] text-yellow-400">⚡</span>}
                    </div>
                    <div className="text-[9px] text-white/40 leading-none mt-0.5">
                        {batteryLevel}% · ~{batterySavedEstimate}% ahorro
                    </div>
                </div>

                {/* Expand chevron */}
                <span className="text-white/30">
                    {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </span>
            </button>

            {/* ── Panel Expandido ── */}
            {expanded && (
                <div
                    className="mt-1.5 rounded-2xl border border-white/10 p-4 space-y-3"
                    style={{
                        background: 'rgba(5,15,10,0.92)',
                        backdropFilter: 'blur(20px)',
                        borderColor: `${cfg?.color || '#40916C'}20`,
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Inteligencia Offline</span>
                        <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: cfg?.bgColor, color: cfg?.color }}
                        >
                            {cfg?.label}
                        </span>
                    </div>

                    {/* Cache stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <StatCard
                            icon={<Database size={12} />}
                            value={cacheStats.totalCached}
                            label="Rutas en caché"
                            color="#40916C"
                        />
                        <StatCard
                            icon={<Zap size={12} />}
                            value={`~${batterySavedEstimate}%`}
                            label="Ahorro batería"
                            color={cfg?.color}
                        />
                        <StatCard
                            icon={isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                            value={predictedRoutesReady.filter(r => r.source === 'cache').length}
                            label="Listas offline"
                            color={isOnline ? '#40916C' : '#FFB703'}
                        />
                        <StatCard
                            icon={<Clock size={12} />}
                            value={cacheStats.storageUsedKB}
                            label="KB en caché"
                            color="#C77DFF"
                        />
                    </div>

                    {/* Top ruta popular */}
                    {cacheStats.topRouteName && cacheStats.topRouteName !== '—' && (
                        <div
                            className="px-3 py-2 rounded-xl text-[9px]"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                            <div className="text-white/40 mb-0.5">Ruta top predicha</div>
                            <div className="text-white font-bold truncate">{cacheStats.topRouteName}</div>
                            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${cacheStats.topRouteScore}%`,
                                        background: `linear-gradient(90deg, ${cfg?.color}, #fff4)`,
                                    }}
                                />
                            </div>
                            <div className="text-white/30 mt-0.5 text-right">Score: {cacheStats.topRouteScore}/100</div>
                        </div>
                    )}

                    {/* Descripción del modo */}
                    <p className="text-[9px] text-white/40 leading-tight italic">
                        {cfg?.description}
                    </p>

                    {/* Sync button + last sync */}
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/30">
                            {isSyncing ? 'Sincronizando...' : formatLastSync(lastSyncTime)}
                        </span>
                        {powerTier !== POWER_TIERS.DEEP_SLEEP && (
                            <button
                                onClick={manualPrefetch}
                                disabled={isSyncing || !isOnline}
                                className="text-[9px] font-bold px-2 py-1 rounded-lg disabled:opacity-30 transition-all active:scale-95"
                                style={{
                                    background: cfg?.bgColor,
                                    color: cfg?.color,
                                    border: `1px solid ${cfg?.color}40`,
                                }}
                            >
                                {isSyncing ? '...' : 'Sync ahora'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Tarjeta de estadística pequeña */
function StatCard({ icon, value, label, color }) {
    return (
        <div
            className="p-2 rounded-xl flex flex-col gap-0.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}
        >
            <div className="flex items-center gap-1" style={{ color }}>
                {icon}
                <span className="text-xs font-black">{value}</span>
            </div>
            <span className="text-[8px] text-white/40 leading-tight">{label}</span>
        </div>
    );
}
