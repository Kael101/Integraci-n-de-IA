import { useState, useEffect, useCallback } from 'react';

/**
 * useGamification
 * ─────────────────────────────────────────────────────────────────────────────
 * Maneja el progreso del usuario: XP, Nivel, Sellos y Sistema de Karma.
 *
 * KARMA (independiente del XP):
 *  - Valor inicial: 100  |  Cap: 200
 *  - +1 por reporte validado por moderador (addKarma)
 *  - -5 por falso positivo detectado (deductKarma)
 *  - Suspensión automática 24 h si karma < SUSPENSION_THRESHOLD (10)
 *  - lastPenaltyTimestamp guardado en el estado principal — lógica de bloqueo
 *    confiable incluso si el historial se corrompe.
 *
 * XP / NIVEL:
 *  - Cada llamada a addXP registra un evento XP_GAIN para getWeeklyScore()
 *  - Niveles calculados con curva: XP_needed = floor(100 · level^1.5)
 *
 * STORAGE:
 *  - Una única clave 'territorio_jaguar_gamification' para todo el estado.
 *  - El historial se limita a 100 eventos (protege rendimiento en hardware modesto).
 */

const STORAGE_KEY = 'territorio_jaguar_gamification';
const KARMA_INITIAL = 100;
const KARMA_CAP = 200;
const SUSPENSION_THRESHOLD = 10;
const SUSPENSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 h

const _getXPForNextLevel = (lvl) => Math.floor(100 * Math.pow(lvl, 1.5));

const _initState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                karma: parsed.karma ?? KARMA_INITIAL,
                xp: parsed.xp ?? 0,
                level: parsed.level ?? 1,
                stamps: parsed.stamps ?? [],
                history: parsed.history ?? [],
                lastPenaltyTimestamp: parsed.lastPenaltyTimestamp ?? null,
            };
        }
    } catch { /* silent */ }
    return {
        karma: KARMA_INITIAL,
        xp: 0,
        level: 1,
        stamps: [],
        history: [],
        lastPenaltyTimestamp: null,
    };
};

export const useGamification = () => {
    const [state, setState] = useState(_initState);
    const [justLeveledUp, setJustLeveledUp] = useState(false);

    // ─── Persistencia automática ──────────────────────────────────────────────
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { /* silent — cuota excedida */ }
    }, [state]);

    // ─── XP / Nivel ──────────────────────────────────────────────────────────

    const addXP = useCallback((amount) => {
        setState(prev => {
            let newXP = prev.xp + amount;
            let newLevel = prev.level;
            let didLevelUp = false;
            let needed = _getXPForNextLevel(newLevel);
            while (newXP >= needed) {
                newXP -= needed;
                newLevel++;
                needed = _getXPForNextLevel(newLevel);
                didLevelUp = true;
            }
            if (didLevelUp) setJustLeveledUp(true);
            const newEvent = {
                id: Date.now(),
                type: 'XP_GAIN',
                amount,
                date: new Date().toISOString(),
            };
            return {
                ...prev,
                xp: newXP,
                level: newLevel,
                history: [...prev.history, newEvent].slice(-100),
            };
        });
    }, []);

    const unlockStamp = useCallback((poiId, xpValue, routeId) => {
        setState(prev => {
            if (prev.stamps.includes(poiId)) return prev;
            const finalXP = routeId === 'RUTA_PANORAMICA' ? Math.round(xpValue * 1.5) : xpValue;
            // Dispara addXP fuera del setState para no anidar actualizaciones
            setTimeout(() => addXP(finalXP), 0);
            return { ...prev, stamps: [...prev.stamps, poiId] };
        });
        return { success: true };
    }, [addXP]);

    const resetLevelUpFlag = useCallback(() => setJustLeveledUp(false), []);

    // ─── KARMA ───────────────────────────────────────────────────────────────

    /**
     * Verifica si el usuario está suspendido por karma bajo.
     * La suspensión dura 24 h desde el momento en que el karma cayó bajo el umbral.
     * Usa lastPenaltyTimestamp del estado — no depende del historial.
     */
    const isSuspended = useCallback(() => {
        if (state.karma >= SUSPENSION_THRESHOLD) return false;
        if (!state.lastPenaltyTimestamp) return false;
        return (Date.now() - state.lastPenaltyTimestamp) < SUSPENSION_DURATION_MS;
    }, [state.karma, state.lastPenaltyTimestamp]);

    /**
     * Resta karma por falso positivo u otra infracción.
     * Si el nuevo karma cae bajo el umbral, registra lastPenaltyTimestamp.
     *
     * @param {number} [amount=5]   - Puntos a restar
     * @param {string} [reason]     - Razón legible
     * @param {string} [reportId]   - ID del reporte causante
     */
    const deductKarma = useCallback((amount = 5, reason = 'Falso positivo', reportId = null) => {
        setState(prev => {
            const newKarma = Math.max(0, prev.karma - amount);
            const crossedThreshold = newKarma < SUSPENSION_THRESHOLD;
            if (crossedThreshold) {
                console.warn(`[Gamification] ⚠️ Karma crítico (${newKarma}). Cuenta en revisión 24 h.`);
            }
            const newEvent = {
                id: Date.now(),
                type: 'PENALTY',
                amount: -amount,
                reason,
                reportId,
                karmaAfter: newKarma,
                date: new Date().toISOString(),
            };
            return {
                ...prev,
                karma: newKarma,
                // Solo actualiza el timestamp la primera vez que cruza el umbral
                lastPenaltyTimestamp: crossedThreshold ? Date.now() : prev.lastPenaltyTimestamp,
                history: [...prev.history, newEvent].slice(-100),
            };
        });
    }, []);

    /**
     * Añade karma por reporte validado por moderador.
     * @param {number} [amount=1]
     * @param {string} [reason]
     */
    const addKarma = useCallback((amount = 1, reason = 'Reporte validado') => {
        setState(prev => {
            const newKarma = Math.min(KARMA_CAP, prev.karma + amount);
            const newEvent = {
                id: Date.now(),
                type: 'REWARD',
                amount,
                reason,
                karmaAfter: newKarma,
                date: new Date().toISOString(),
            };
            return {
                ...prev,
                karma: newKarma,
                history: [...prev.history, newEvent].slice(-100),
            };
        });
    }, []);

    /** @returns {Array<{type, amount, reason, reportId, karmaAfter, date}>} */
    const getKarmaHistory = useCallback(() => state.history, [state.history]);

    // ─── LEADERBOARD SEMANAL ─────────────────────────────────────────────────

    /** XP ganada en los últimos 7 días (para leaderboard). */
    const getWeeklyScore = useCallback(() => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return state.history
            .filter(e => e.type === 'XP_GAIN' && new Date(e.date).getTime() > cutoff)
            .reduce((sum, e) => sum + e.amount, 0);
    }, [state.history]);

    // ─── Debug ────────────────────────────────────────────────────────────────
    if (typeof window !== 'undefined') {
        window.__debug_karma = () => ({
            karma: state.karma,
            isSuspended: isSuspended(),
            weeklyScore: getWeeklyScore(),
            history: state.history.slice(-10),
            suspensionEndsAt: state.lastPenaltyTimestamp
                ? new Date(state.lastPenaltyTimestamp + SUSPENSION_DURATION_MS).toLocaleString()
                : 'N/A',
        });
    }

    // ─── API pública ──────────────────────────────────────────────────────────
    return {
        // XP / Nivel
        currentXP: state.xp,
        level: state.level,
        unlockedStamps: state.stamps,
        xpToNext: _getXPForNextLevel(state.level) - state.xp,
        progressPercent: (state.xp / _getXPForNextLevel(state.level)) * 100,
        addXP,
        unlockStamp,
        justLeveledUp,
        resetLevelUpFlag,
        // Karma
        karma: state.karma,
        isSuspended: isSuspended(),
        deductKarma,
        addKarma,
        getKarmaHistory,
        // Leaderboard
        getWeeklyScore,
    };
};

export default useGamification;
