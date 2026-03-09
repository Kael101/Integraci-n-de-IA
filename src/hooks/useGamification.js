import { useState, useEffect, useCallback } from 'react';

/**
 * useGamification
 * ─────────────────────────────────────────────────────────────────────────────
 * Maneja el progreso del usuario: XP, Nivel, Sellos y Sistema de Karma.
 *
 * KARMA:
 *  - Valor inicial: 100
 *  - +1 por reporte validado (llamar addXP sigue siendo la recompensa principal)
 *  - -5 por falso positivo detectado (deductKarma)
 *  - Suspensión automática 24h si karma < 10
 *  - Registro histórico local de eventos de karma para transparencia
 *
 * LEADERBOARD SEMANAL:
 *  - getWeeklyScore() → XP ganada en los últimos 7 días
 */
export const useGamification = () => {
    const [currentXP, setCurrentXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [unlockedStamps, setUnlockedStamps] = useState([]);
    const [justLeveledUp, setJustLeveledUp] = useState(false);
    const [karma, setKarma] = useState(100);

    // ─── Carga inicial ───────────────────────────────────────────────────────

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('passport_progress') || '{}');
        if (saved) {
            setCurrentXP(saved.xp || 0);
            setLevel(saved.level || 1);
            setUnlockedStamps(saved.stamps || []);
            setKarma(saved.karma ?? 100);
        }
    }, []);

    // ─── Persistencia ────────────────────────────────────────────────────────

    useEffect(() => {
        localStorage.setItem('passport_progress', JSON.stringify({
            xp: currentXP,
            level,
            stamps: unlockedStamps,
            karma,
        }));
    }, [currentXP, level, unlockedStamps, karma]);

    // ─── XP / Nivel ──────────────────────────────────────────────────────────

    const getXPForNextLevel = (currentLevel) =>
        Math.floor(100 * Math.pow(currentLevel, 1.5));

    const addXP = useCallback((amount) => {
        // Registrar para el score semanal
        _recordWeeklyXP(amount);

        setCurrentXP(prevXP => {
            let newXP = prevXP + amount;
            setLevel(prevLevel => {
                let newLevel = prevLevel;
                let needed = getXPForNextLevel(newLevel);
                while (newXP >= needed) {
                    newXP -= needed;
                    newLevel++;
                    needed = getXPForNextLevel(newLevel);
                    setJustLeveledUp(true);
                }
                return newLevel;
            });
            return newXP;
        });
    }, []);

    const unlockStamp = useCallback((poiId, xpValue, routeId) => {
        setUnlockedStamps(prev => {
            if (prev.includes(poiId)) return prev;
            let finalXP = xpValue;
            if (routeId === 'RUTA_PANORAMICA') finalXP = Math.round(xpValue * 1.5);
            addXP(finalXP);
            return [...prev, poiId];
        });
        return { success: true };
    }, [addXP]);

    const resetLevelUpFlag = () => setJustLeveledUp(false);

    // ─── KARMA ───────────────────────────────────────────────────────────────

    const KARMA_SUSPENSION_THRESHOLD = 10;
    const SUSPENSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
    const KARMA_LOG_KEY = 'tj_karma_history';

    /**
     * Verifica si el usuario está suspendido por karma bajo.
     * La suspensión dura 24h desde la última vez que cayó bajo el umbral.
     * @returns {boolean}
     */
    const isSuspended = useCallback(() => {
        if (karma >= KARMA_SUSPENSION_THRESHOLD) return false;
        const log = _loadKarmaLog();
        const lastPenalty = log.filter(e => e.type === 'deduction')
            .sort((a, b) => b.ts - a.ts)[0];
        if (!lastPenalty) return false;
        return (Date.now() - lastPenalty.ts) < SUSPENSION_DURATION_MS;
    }, [karma]);

    /**
     * Resta karma por falso positivo u otra infracción.
     * Registra el evento en el historial local.
     *
     * @param {number} [amount=5]  - Puntos a restar (default: -5)
     * @param {string} [reason]    - Razón legible del descuento
     * @param {string} [reportId]  - ID del reporte causante
     */
    const deductKarma = useCallback((amount = 5, reason = 'Falso positivo', reportId = null) => {
        setKarma(prev => {
            const newKarma = Math.max(0, prev - amount);
            _logKarmaEvent({
                type: 'deduction',
                amount: -amount,
                reason,
                reportId,
                karmaAfter: newKarma,
                ts: Date.now(),
            });
            if (newKarma < KARMA_SUSPENSION_THRESHOLD) {
                console.warn(`[Gamification] ⚠️ Karma crítico (${newKarma}). Cuenta en revisión 24h.`);
            }
            return newKarma;
        });
    }, []);

    /**
     * Añade karma por reporte validado por moderadores.
     * @param {number} [amount=1]
     * @param {string} [reason]
     */
    const addKarma = useCallback((amount = 1, reason = 'Reporte validado') => {
        setKarma(prev => {
            const newKarma = Math.min(100, prev + amount);
            _logKarmaEvent({ type: 'reward', amount, reason, karmaAfter: newKarma, ts: Date.now() });
            return newKarma;
        });
    }, []);

    /**
     * Retorna el historial de eventos de karma.
     * @returns {Array<{type, amount, reason, karmaAfter, ts}>}
     */
    const getKarmaHistory = useCallback(() => _loadKarmaLog(), []);

    // ─── LEADERBOARD SEMANAL ─────────────────────────────────────────────────

    const WEEKLY_XP_KEY = 'tj_weekly_xp_log';

    /**
     * Score XP acumulado en los últimos 7 días.
     * @returns {number}
     */
    const getWeeklyScore = useCallback(() => {
        try {
            const log = JSON.parse(localStorage.getItem(WEEKLY_XP_KEY) || '[]');
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return log
                .filter(e => e.ts >= cutoff)
                .reduce((sum, e) => sum + e.amount, 0);
        } catch {
            return 0;
        }
    }, []);

    // ─── Privadas ────────────────────────────────────────────────────────────

    const _loadKarmaLog = () => {
        try { return JSON.parse(localStorage.getItem(KARMA_LOG_KEY) || '[]'); }
        catch { return []; }
    };

    const _logKarmaEvent = (event) => {
        try {
            const log = _loadKarmaLog();
            log.push(event);
            // Mantener solo últimos 100 eventos
            localStorage.setItem(KARMA_LOG_KEY, JSON.stringify(log.slice(-100)));
        } catch { /* silent */ }
    };

    const _recordWeeklyXP = (amount) => {
        try {
            const log = JSON.parse(localStorage.getItem(WEEKLY_XP_KEY) || '[]');
            log.push({ amount, ts: Date.now() });
            // Mantener solo últimos 7 días
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            localStorage.setItem(WEEKLY_XP_KEY, JSON.stringify(
                log.filter(e => e.ts >= cutoff).slice(-500)
            ));
        } catch { /* silent */ }
    };

    // ── Debug helpers ─────────────────────────────────────────────────────────
    if (typeof window !== 'undefined') {
        window.__debug_karma = () => ({
            karma,
            isSuspended: isSuspended(),
            weeklyScore: getWeeklyScore(),
            history: getKarmaHistory().slice(-10),
        });
    }

    return {
        // XP / Nivel
        currentXP,
        level,
        unlockedStamps,
        xpToNext: getXPForNextLevel(level) - currentXP,
        progressPercent: (currentXP / getXPForNextLevel(level)) * 100,
        addXP,
        unlockStamp,
        justLeveledUp,
        resetLevelUpFlag,
        // Karma
        karma,
        isSuspended,
        deductKarma,
        addKarma,
        getKarmaHistory,
        // Leaderboard
        getWeeklyScore,
    };
};

export default useGamification;

