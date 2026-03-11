import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';
import { useGamification } from './useGamification';
import { useJaguarCoins } from './useJaguarCoins';

/**
 * useTrailGamification
 * ─────────────────────────────────────────────────────────────────────────────
 * Conecta la posición GPS exacta del usuario con la geometría del sendero
 * activo (GeoJSON) usando Turf.js para detectar proximidad y generar
 * recompensas de forma automática.
 *
 * PRIVACIDAD: Este hook SIEMPRE opera con coordenadas exactas (NO fuzzeadas).
 * Las coordenadas fuzzeadas (fuzzCoordinates / σ=166m) son exclusivas del
 * heatmap público y del sentinelReportService — nunca para cálculos de ruta.
 *
 * RECOMPENSAS (por interval de 5 min en ruta):
 *   +15 XP          → useGamification.addXP
 *   +1 Karma        → useGamification.addKarma  (refuerzo positivo)
 *   +1 Garra de Oro → useJaguarCoins.earnFromKm (si se acumuló ≥ 1 km)
 *
 * ANTI-SPOOFING:
 *   - Requiere TRAIL_ON_THRESHOLD eventos consecutivos dentro del umbral
 *     antes de empezar a contar XP (evita falsear con un punto GPS aislado).
 *   - El timestamp del último XP (lastXPAwardedTime) es internal ref, no
 *     modificable desde fuera.
 *   - Se cruza con isSuspended() de useGamification — si hay suspensión
 *     por karma bajo, no se emite ninguna recompensa.
 *
 * RANGOS JAGUAR (calculados del nivel en useGamification):
 *   Nivel 1–4   → 🥾 Explorador
 *   Nivel 5–9   → 💧 Guardián del Upano
 *   Nivel 10–19 → 🌿 Guardián de la Selva
 *   Nivel 20+   → 🐆 Guardián Jaguar
 *
 * @param {[number, number] | null} userLocation   — [lon, lat] exactos (useUserLocation)
 * @param {GeoJSON.FeatureCollection | null} trailGeoJSON — GeoJSON de la ruta GPX activa
 * @param {object} [options]
 * @param {number} [options.thresholdMeters=50]    — radio de "en ruta" (metros)
 * @param {number} [options.xpInterval=300_000]    — ms entre recompensas XP (default 5 min)
 * @param {number} [options.xpAmount=15]           — XP por intervalo
 * @param {boolean} [options.enabled=true]         — desactivar sin desmontar el hook
 */
export function useTrailGamification(userLocation, trailGeoJSON, {
  thresholdMeters = 50,
  xpInterval      = 5 * 60 * 1000,   // 5 minutos
  xpAmount        = 15,
  enabled         = true,
} = {}) {

  // ── Hooks de recompensa existentes en el proyecto ────────────────────────────
  const { addXP, addKarma, level, isSuspended } = useGamification();
  const { earnFromKm }                          = useJaguarCoins();

  // ── Estado público del hook ──────────────────────────────────────────────────
  const [isOnTrail, setIsOnTrail]           = useState(false);
  const [distanceToTrail, setDistanceToTrail] = useState(null);
  const [consecutiveTicks, setConsecutiveTicks] = useState(0); // ticks "en ruta"
  const [sessionStats, setSessionStats]     = useState({
    xpEarned:       0,
    coinsEarned:    0,
    timeOnTrailMs:  0,
    distanceKm:     0,
    lastRewardAt:   null,
  });

  // ── Refs internos (resistente a stale closures) ──────────────────────────────
  const lastXPAwardedTime  = useRef(0);
  const lastPositionRef    = useRef(null);
  const distanceWalkedKm   = useRef(0);     // km acumulados en esta sesión
  const onTrailSince       = useRef(null);  // timestamp del inicio del tramo actual

  // ── Constante anti-spoofing: eventos mínimos antes de premiar ───────────────
  const TRAIL_ON_THRESHOLD = 2; // al menos 2 ciclos de effect (≈ 2 actualizaciones GPS)

  // ── Efecto principal de detección ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !userLocation || !trailGeoJSON?.features?.length) return;

    // Extraer el primer feature de tipo línea del GeoJSON convertido del GPX
    const trailLine = trailGeoJSON.features.find(
      f => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
    );
    if (!trailLine) return;

    try {
      // 1. Punto Turf del usuario (coordenadas EXACTAS — nunca fuzzeadas aquí)
      const userPoint = turf.point(userLocation);  // userLocation ya es [lon, lat]

      // 2. Distancia en metros al sendero (operación O(n) sobre los segmentos del GPX)
      const distM = turf.pointToLineDistance(userPoint, trailLine, { units: 'meters' });
      const distRounded = Math.round(distM);
      setDistanceToTrail(distRounded);

      // 3. Acumular distancia recorrida desde el punto anterior (para Coins)
      if (lastPositionRef.current) {
        const prevPoint = turf.point(lastPositionRef.current);
        const stepKm = turf.distance(prevPoint, userPoint, { units: 'kilometers' });
        // Filtro de teleport: ignorar saltos >200m entre actualizaciones GPS
        if (stepKm < 0.2) {
          distanceWalkedKm.current += stepKm;
        }
      }
      lastPositionRef.current = userLocation;

      // 4. ¿Está dentro del umbral de sendero?
      if (distRounded <= thresholdMeters) {

        // Anti-spoofing: acumular ticks consecutivos
        setConsecutiveTicks(prev => prev + 1);

        if (!onTrailSince.current) onTrailSince.current = Date.now();
        setIsOnTrail(true);

        // 5. Recompensa (solo si supera el umbral de ticks y no hay suspensión)
        const now = Date.now();
        const ticksToStart = consecutiveTicks + 1; // el +1 es el tick actual
        const canReward = (
          ticksToStart >= TRAIL_ON_THRESHOLD &&
          now - lastXPAwardedTime.current > xpInterval &&
          !isSuspended
        );

        if (canReward) {
          // 5a. XP — alimenta la curva de progreso de nivel
          addXP(xpAmount);

          // 5b. Karma positivo por conservar el sendero oficial
          addKarma(1, 'Caminata en sendero oficial');

          // 5c. Garras de Oro por km recorridos desde la última recompensa
          const kmToAward = distanceWalkedKm.current;
          if (kmToAward >= 1) {
            earnFromKm(kmToAward);
            distanceWalkedKm.current = 0;  // resetear contador de km
          }

          lastXPAwardedTime.current = now;

          setSessionStats(prev => ({
            xpEarned:      prev.xpEarned + xpAmount,
            coinsEarned:   prev.coinsEarned + Math.floor(kmToAward),
            timeOnTrailMs: prev.timeOnTrailMs + (onTrailSince.current ? now - onTrailSince.current : 0),
            distanceKm:    parseFloat((prev.distanceKm + kmToAward).toFixed(3)),
            lastRewardAt:  new Date(now).toISOString(),
          }));

          console.log(
            `[TrailGamification] ✅ +${xpAmount} XP | +1 Karma | +${Math.floor(kmToAward)} Garras\n` +
            `  Distancia al sendero: ${distRounded}m | Nivel actual: ${level}`
          );
        }

      } else {
        // Fuera del sendero — reiniciar ticks y marcar salida
        setConsecutiveTicks(0);
        setIsOnTrail(false);
        onTrailSince.current = null;
      }

    } catch (err) {
      console.error('[TrailGamification] Error en cálculo Turf:', err);
    }

  }, [userLocation, trailGeoJSON, enabled, thresholdMeters, xpInterval, xpAmount,
      addXP, addKarma, earnFromKm, isSuspended, level, consecutiveTicks]);

  // ── Rango Jaguar derivado del nivel ──────────────────────────────────────────
  const jaguarRank = useCallback(() => {
    if (level >= 20) return { label: 'Guardián Jaguar', emoji: '🐆', color: '#f59e0b' };
    if (level >= 10) return { label: 'Guardián de la Selva', emoji: '🌿', color: '#22c55e' };
    if (level >= 5)  return { label: 'Guardián del Upano', emoji: '💧', color: '#0ea5e9' };
    return           { label: 'Explorador', emoji: '🥾', color: '#94a3b8' };
  }, [level]);

  // ── Reset de sesión (al cambiar de sendero) ──────────────────────────────────
  const resetSession = useCallback(() => {
    lastXPAwardedTime.current = 0;
    lastPositionRef.current   = null;
    distanceWalkedKm.current  = 0;
    onTrailSince.current      = null;
    setConsecutiveTicks(0);
    setIsOnTrail(false);
    setDistanceToTrail(null);
    setSessionStats({ xpEarned: 0, coinsEarned: 0, timeOnTrailMs: 0, distanceKm: 0, lastRewardAt: null });
    console.log('[TrailGamification] 🔄 Sesión reiniciada.');
  }, []);

  // ── Debug helpers ─────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.__debug_trail_gamification = () => ({
      isOnTrail,
      distanceToTrail,
      consecutiveTicks,
      sessionStats,
      jaguarRank: jaguarRank(),
      isSuspended,
      lastXPAwardedAt: lastXPAwardedTime.current
        ? new Date(lastXPAwardedTime.current).toLocaleTimeString('es-EC')
        : 'nunca',
    });
  }

  // ── API pública ───────────────────────────────────────────────────────────────
  return {
    /** true si el usuario está dentro del umbral de sendero */
    isOnTrail,
    /** distancia en metros al sendero más cercano */
    distanceToTrail,
    /** estadísticas acumuladas de la sesión actual */
    sessionStats,
    /** rango Jaguar derivado del nivel: { label, emoji, color } */
    jaguarRank: jaguarRank(),
    /** reiniciar la sesión (llamar al cambiar de sendero) */
    resetSession,
    /** ticks consecutivos dentro del umbral (útil para debug / barra de carga) */
    consecutiveTicks,
  };
}

export default useTrailGamification;
