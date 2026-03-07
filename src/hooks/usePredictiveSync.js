// src/hooks/usePredictiveSync.js
/**
 * PREDICTIVE SYNC ORCHESTRATOR
 * Territorio Jaguar · Intelligence Layer
 * ================================================
 * Hook central que une el motor de IA (PredictiveCache) con el nivel
 * de energía (useAdaptivePowerMode) para gestionar automáticamente
 * la sincronización predictiva y el ahorro de batería.
 *
 * COMPORTAMIENTO POR TIER:
 *  TURBO      → Pre-fetching agresivo (top 5 rutas) + evicción de caché
 *  NORMAL     → Pre-fetching conservador (top 3 rutas)
 *  ECO        → Solo lectura de caché, cero llamadas de red
 *  DEEP_SLEEP → Modo supervivencia: solo canal SOS activo
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdaptivePowerMode, POWER_TIERS } from './useAdaptivePowerMode';
import { PredictiveCache } from '../services/predictiveCache';
import { syncService } from '../services/syncService';

const PREFETCH_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos entre prefetches

export function usePredictiveSync({ providers = null } = {}) {
    const powerMode = useAdaptivePowerMode();
    const { powerTier, allowSync, tierConfig, estimatedSavings } = powerMode;

    const [cacheStats, setCacheStats] = useState({ totalCached: 0, totalVisits: 0, topRouteScore: 0, storageUsedKB: 0 });
    const [predictedRoutesReady, setPredictedRoutesReady] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const lastPrefetchRef = useRef(0);
    const syncIntervalRef = useRef(null);

    // ── Leer estadísticas del caché ──────────────────────────────
    const refreshStats = useCallback(() => {
        const stats = PredictiveCache.getStats();
        setCacheStats(stats);
    }, []);

    // ── Prefetch proactivo según tier ────────────────────────────
    const runPredictivePrefetch = useCallback(async () => {
        if (!allowSync) {
            console.log(`[PredictiveSync] Skipping prefetch in ${powerTier} mode.`);
            return;
        }

        const now = Date.now();
        if (now - lastPrefetchRef.current < PREFETCH_COOLDOWN_MS) return;
        lastPrefetchRef.current = now;

        const topN = powerTier === POWER_TIERS.TURBO ? 5 : 3;
        const topRoutes = PredictiveCache.getTopRoutes(topN);

        if (topRoutes.length === 0) {
            console.log('[PredictiveSync] No route history yet. Skipping prefetch.');
            return;
        }

        console.log(`[PredictiveSync] Top routes (${powerTier}):`, topRoutes.map(r => `${r.meta?.name || r.routeId}(${r.score})`).join(', '));

        setIsSyncing(true);

        try {
            const ready = [];

            for (const route of topRoutes) {
                const isPopular = route.score >= 60;
                const isFresh = PredictiveCache.isCacheFresh(route.routeId, isPopular);

                if (isFresh) {
                    // Ya en caché y vigente → no descargar
                    ready.push({ ...route, source: 'cache' });
                    continue;
                }

                if (navigator.onLine && route.meta?.geojson && providers) {
                    // Pre-cargar activos de la ruta con proveedores cercanos
                    await syncService.smartPrefetch(route.meta.geojson, providers, route.routeId);
                    PredictiveCache.setManifest(route.routeId, {
                        providers: true,
                        tiles: false, // tiles requieren SW (future)
                        waypoints: true,
                        score: route.score,
                    });
                    ready.push({ ...route, source: 'network' });
                } else {
                    // Sin red o sin geojson → marcar como conocida pero sin datos
                    ready.push({ ...route, source: 'unavailable' });
                }
            }

            setPredictedRoutesReady(ready);
            setLastSyncTime(new Date());
            console.log(`[PredictiveSync] Prefetch complete: ${ready.filter(r => r.source !== 'unavailable').length}/${ready.length} routes ready.`);

            // En TURBO, también hacemos evicción de entradas viejas
            if (powerTier === POWER_TIERS.TURBO) {
                PredictiveCache.evictStaleEntries();
            }
        } catch (err) {
            console.warn('[PredictiveSync] Prefetch error:', err.message);
        } finally {
            setIsSyncing(false);
            refreshStats();
        }
    }, [allowSync, powerTier, providers, refreshStats]);

    // ── Registrar visita a una ruta ──────────────────────────────
    const recordRouteVisit = useCallback((routeId, meta) => {
        PredictiveCache.recordVisit(routeId, meta);
        refreshStats();
    }, [refreshStats]);

    // ── Ciclo principal: prefetch periódico adaptado al tier ─────
    useEffect(() => {
        // Intervalo de sync según tier (TURBO: 5min, NORMAL: 10min, ECO/DEEP_SLEEP: sin sync)
        const syncIntervalMs = powerTier === POWER_TIERS.TURBO ? 5 * 60 * 1000
            : powerTier === POWER_TIERS.NORMAL ? 10 * 60 * 1000
                : null;

        // Lanzar prefetch inicial inmediatamente
        runPredictivePrefetch();
        refreshStats();

        if (syncIntervalMs) {
            syncIntervalRef.current = setInterval(runPredictivePrefetch, syncIntervalMs);
        }

        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        };
    }, [powerTier, runPredictivePrefetch, refreshStats]);

    // ── Escuchar evento 'online' para sync inmediata al reconectar ─
    useEffect(() => {
        const handleOnline = () => {
            if (allowSync) {
                lastPrefetchRef.current = 0; // Reset cooldown
                runPredictivePrefetch();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [allowSync, runPredictivePrefetch]);

    return {
        // Estado del sistema predictivo
        cacheStats,
        predictedRoutesReady,
        isSyncing,
        lastSyncTime,

        // Del power mode (relay para componentes)
        ...powerMode,

        // Acciones públicas
        recordRouteVisit,
        manualPrefetch: () => {
            lastPrefetchRef.current = 0;
            runPredictivePrefetch();
        },

        // UI helpers
        batterySavedEstimate: estimatedSavings,
        tierLabel: tierConfig?.label || powerTier,
        tierIcon: tierConfig?.icon || '🌿',
        tierColor: tierConfig?.color || '#40916C',
    };
}

export default usePredictiveSync;
