import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useGamification } from '../../hooks/useGamification';
import { useJaguarCoins } from '../../hooks/useJaguarCoins';

// AR Scanner — lazy para no bloquear el bundle del mapa
const ARScannerView = lazy(() => import('../ar/ARScannerView'));

/**
 * TrailHUD — Panel flotante de gamificación para el mapa de senderos.
 *
 * Lee XP, Karma y Coins directamente de los hooks del proyecto.
 * Solo recibe contexto del sendero activo como props (desde useTrailGamification).
 *
 * Props:
 *   isOnTrail       {boolean}         — usuario dentro de 50m del sendero
 *   distanceToTrail {number|null}     — metros al sendero más cercano
 *   sessionStats    {object}          — { xpEarned, coinsEarned, distanceKm, lastRewardAt }
 *   trailName       {string}          — nombre del sendero GPX activo
 *   isOnTrail       {boolean}
 */

// ─── Umbrales de rango XP (basados en XP total acumulado) ─────────────────────
// Alineados con los niveles de useGamification (level^1.5 * 100):
//   Nivel 1 = 100 XP, Nivel 5 = ~1118 XP acumulados, Nivel 10 = ~3162 XP acumulados
const RANK_THRESHOLDS = [
  { id: 'explorador',     emoji: '🥾', label: 'Explorador',          minXP: 0,    color: '#94a3b8' },
  { id: 'upano',          emoji: '💧', label: 'Guardián del Upano',  minXP: 1500, color: '#0ea5e9' },
  { id: 'selva',          emoji: '🌿', label: 'Guardián de la Selva',minXP: 4000, color: '#22c55e' },
  { id: 'jaguar',         emoji: '🐆', label: 'Guardián Jaguar',     minXP: 8000, color: '#f59e0b' },
];

/**
 * Devuelve el rango actual, el siguiente y el porcentaje de progreso
 * entre ellos — basado en XP total acumulado del perfil.
 */
function resolveRank(totalXP) {
  let current = RANK_THRESHOLDS[0];
  let next    = RANK_THRESHOLDS[1];

  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= RANK_THRESHOLDS[i].minXP) {
      current = RANK_THRESHOLDS[i];
      next    = RANK_THRESHOLDS[i + 1] ?? null;
      break;
    }
  }

  const isMax = !next;
  const progress = isMax
    ? 100
    : ((totalXP - current.minXP) / (next.minXP - current.minXP)) * 100;

  return { current, next, progress: Math.min(100, Math.max(0, progress)), isMax };
}

/** Devuelve el color semántico para el Karma según el sistema del proyecto */
function karmaColor(karma) {
  if (karma < 20)  return '#ef4444'; // Rojo — zona crítica, suspensión inminente
  if (karma < 50)  return '#f59e0b'; // Ámbar — advertencia
  if (karma < 100) return '#84cc16'; // Lima — saludable
  return '#10b981';                  // Verde esmeralda — excelente
}

function karmaLabel(karma) {
  if (karma < 20)  return '⚠️ Karma crítico';
  if (karma < 50)  return '😐 Karma bajo';
  if (karma < 100) return '😊 Karma OK';
  return '🌟 Karma alto';
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorías de incidencia → mapeadas al campo category de saveReport
const INCIDENT_CATEGORIES = [
  { id: 'deforestation',   emoji: '🪓', label: 'Tala' },
  { id: 'waste',           emoji: '🗑️', label: 'Basura' },
  { id: 'fauna_threat',    emoji: '🐾', label: 'Fauna' },
  { id: 'water_pollution', emoji: '💧', label: 'Agua' },
];

export default function TrailHUD({ isOnTrail, distanceToTrail, sessionStats, trailName, onReportIncident }) {

  // ── Estado del panel de reporte ───────────────────────────────────────────
  const [isReporting, setIsReporting]       = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  // ── Estado del Escáner AR ─────────────────────────────────────────────────
  const [showAR, setShowAR] = useState(false);
  const [arStation, setArStation] = useState('jaguar');

  const handleCategorySelect = useCallback((cat) => {
    setIsReporting(false);
    onReportIncident?.(cat);
    setReportFeedback({ text: `Reporte "${cat.label}" enviado. +5 🪙`, ok: true });
    setTimeout(() => setReportFeedback(null), 4000);
  }, [onReportIncident]);

  // ── Datos reales del perfil del jugador ───────────────────────────────────
  const {
    currentXP,
    level,
    progressPercent: levelProgressPercent,
    xpToNext,
    karma,
    isSuspended,
    getWeeklyScore,
  } = useGamification();

  const { balance: coins } = useJaguarCoins();

  // ── XP total acumulado (suma de niveles anteriores) ───────────────────────
  // useGamification expone xp dentro del nivel actual; calculamos el total
  // acumulado aproximado para mapear al rango XP.
  const totalXPApprox = useMemo(() => {
    // Suma de XP requerida para llegar al nivel actual
    let accumulated = 0;
    for (let l = 1; l < level; l++) {
      accumulated += Math.floor(100 * Math.pow(l, 1.5));
    }
    return accumulated + currentXP;
  }, [level, currentXP]);

  const weeklyXP    = useMemo(() => getWeeklyScore(), [getWeeklyScore]);
  const { current: rank, next: nextRank, progress: rankProgress, isMax } = useMemo(
    () => resolveRank(totalXPApprox),
    [totalXPApprox]
  );

  // ── Derivados de UI ───────────────────────────────────────────────────────
  const borderColor  = isOnTrail ? '#22c55e' : isSuspended ? '#ef4444' : 'rgba(255,255,255,0.12)';
  const statusColor  = isOnTrail ? '#22c55e' : '#f97316';
  const statusText   = isSuspended
    ? '🚫 Cuenta suspendida temporalmente'
    : isOnTrail
      ? 'En sendero — Ganando XP'
      : distanceToTrail !== null
        ? `${distanceToTrail}m del sendero`
        : 'Calculando…';

  return (
    <div style={{ ...s.panel, borderColor }}>

      {/* ── Cabecera: Rango + Karma badge ───────────────────────────────── */}
      <div style={s.header}>
        <div style={s.rankRow}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{rank.emoji}</span>
          <div>
            <div style={s.rankLabel}>{rank.label}</div>
            <div style={s.levelLabel}>Nv. {level} · {totalXPApprox.toLocaleString()} XP total</div>
          </div>
        </div>

        {/* Karma badge */}
        <div style={{ ...s.karmaBadge, color: karmaColor(karma), borderColor: karmaColor(karma) + '55' }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>{karma}</span>
          <span style={{ fontSize: 9, opacity: 0.75 }}>/200</span>
        </div>
      </div>

      {/* ── Barra de progreso hacia el siguiente rango ───────────────────── */}
      <div style={s.progressSection}>
        <div style={s.progressLabels}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            {isMax ? '🏆 Rango máximo alcanzado' : `Hacia ${nextRank?.emoji} ${nextRank?.label}`}
          </span>
          {!isMax && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              {(nextRank.minXP - totalXPApprox).toLocaleString()} XP restantes
            </span>
          )}
        </div>
        <div style={s.progressTrack}>
          <div style={{
            ...s.progressFill,
            width: `${rankProgress}%`,
            background: `linear-gradient(90deg, ${rank.color}, ${nextRank?.color ?? rank.color})`,
          }} />
        </div>

        {/* Progreso hacia el siguiente nivel (curva level^1.5) */}
        <div style={s.progressLabels}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
            Nivel {level} → {level + 1}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
            {xpToNext} XP
          </span>
        </div>
        <div style={{ ...s.progressTrack, height: 3, marginTop: 2 }}>
          <div style={{
            ...s.progressFill,
            width: `${levelProgressPercent}%`,
            background: 'rgba(255,255,255,0.3)',
          }} />
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={s.divider} />

      {/* ── Estado en ruta ──────────────────────────────────────────────── */}
      <div style={s.statusRow}>
        <span style={{
          display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
          background: statusColor, flexShrink: 0,
          boxShadow: isOnTrail ? `0 0 7px ${statusColor}` : 'none',
          animation: isOnTrail ? 'hud-pulse 1.8s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: isOnTrail ? '#86efac' : '#fcd34d' }}>
          {statusText}
        </span>
      </div>

      {/* Alerta si está fuera de ruta */}
      {!isOnTrail && !isSuspended && distanceToTrail !== null && distanceToTrail > 50 && (
        <div style={s.offTrailAlert}>
          Vuelve al sendero para proteger la flora y seguir ganando XP.
        </div>
      )}

      {/* Sendero activo */}
      {trailName && (
        <div style={s.trailNameRow}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Sendero</span>
          <span style={s.trailName}>{trailName}</span>
        </div>
      )}

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={s.divider} />

      {/* ── Estadísticas de la sesión actual ────────────────────────────── */}
      <div style={s.statsGrid}>
        <Stat icon="⭐" label="XP sesión"  value={`+${sessionStats?.xpEarned ?? 0}`} color="#fbbf24" />
        <Stat icon="🥾" label="Recorrido"  value={`${(sessionStats?.distanceKm ?? 0).toFixed(2)} km`} color="#86efac" />
        <Stat icon="🪙" label="Garras"     value={`+${sessionStats?.coinsEarned ?? 0}`} color="#a78bfa" />
        <Stat icon="📅" label="Esta semana" value={`${weeklyXP} XP`} color="#60a5fa" />
      </div>

      {/* ── Karma status ─────────────────────────────────────────────────── */}
      <div style={{ ...s.karmaBar, color: karmaColor(karma) }}>
        <span>{karmaLabel(karma)}</span>
        <div style={s.karmaTrack}>
          <div style={{
            ...s.karmaFill,
            width: `${(karma / 200) * 100}%`,
            background: karmaColor(karma),
          }} />
        </div>
        <span style={{ fontSize: 10, opacity: 0.7 }}>{karma}/200</span>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={s.divider} />

      {/* ── Botón / Panel de Reporte Sentinel ───────────────────────────── */}
      {!isReporting ? (
        <button
          style={{ ...s.reportBtn, opacity: isSuspended ? 0.45 : 1 }}
          onClick={() => !isSuspended && setIsReporting(true)}
          disabled={isSuspended}
        >
          🚨 Reportar incidencia ambiental
        </button>
      ) : (
        <div style={s.reportPanel}>
          <div style={s.reportQuestion}>¿Qué encontraste en el sendero?</div>
          <div style={s.reportGrid}>
            {INCIDENT_CATEGORIES.map(cat => (
              <button key={cat.id} style={s.categoryBtn} onClick={() => handleCategorySelect(cat)}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.emoji}</span>
                <span style={{ fontSize: 10, marginTop: 2 }}>{cat.label}</span>
              </button>
            ))}
          </div>
          <button style={s.cancelBtn} onClick={() => setIsReporting(false)}>Cancelar</button>
        </div>
      )}

      {/* Toast de confirmación */}
      {reportFeedback && (
        <div style={{
          ...s.feedbackToast,
          borderColor: reportFeedback.ok ? '#22c55e44' : '#ef444444',
          color: reportFeedback.ok ? '#86efac' : '#fca5a5',
        }}>
          {reportFeedback.ok ? '✅' : '⚠️'} {reportFeedback.text}
        </div>
      )}

      {/* ── Botón Estación AR ─────────────────────────────────────────────── */}
      <button
        style={s.arBtn}
        onClick={() => { setArStation('jaguar'); setShowAR(true); }}
      >
        <span style={{ fontSize: 16 }}>🐆</span>
        <span>Estación AR · Jaguar</span>
      </button>

      {/* Portal del escáner AR — montado sobre el HUD sin salir del mapa */}
      {showAR && (
        <Suspense fallback={null}>
          <ARScannerView station={arStation} onClose={() => setShowAR(false)} />
        </Suspense>
      )}

      {/* Animaciones */}
      <style>{`
        @keyframes hud-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-componente Stat ────────────────────────────────────────────────────────
function Stat({ icon, label, value, color }) {
  return (
    <div style={s.statCell}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', lineHeight: 1.2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos locales del componente
// ─────────────────────────────────────────────────────────────────────────────
const s = {
  panel: {
    position: 'absolute',
    bottom: 30, left: '50%',
    transform: 'translateX(-50%)',
    width: '90%', maxWidth: 360,
    zIndex: 20,
    background: 'rgba(14, 22, 14, 0.88)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid',
    borderRadius: 18,
    padding: '14px 16px',
    color: '#fff',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'border-color 0.4s ease',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  rankRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  rankLabel: {
    fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2,
  },
  levelLabel: {
    fontSize: 9.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.2, marginTop: 1,
  },
  karmaBadge: {
    display: 'flex', alignItems: 'baseline', gap: 1,
    padding: '3px 8px', borderRadius: 10,
    border: '1px solid', background: 'rgba(0,0,0,0.35)',
    flexShrink: 0,
  },
  progressSection: {
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  progressLabels: {
    display: 'flex', justifyContent: 'space-between',
  },
  progressTrack: {
    width: '100%', height: 6,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
  },
  divider: {
    height: 1, background: 'rgba(255,255,255,0.08)',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  offTrailAlert: {
    fontSize: 10.5, color: '#fca5a5',
    background: 'rgba(239,68,68,0.08)',
    borderRadius: 7, padding: '5px 10px',
    lineHeight: 1.5,
  },
  trailNameRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  trailName: {
    fontSize: 11, fontWeight: 600, color: '#cbd5e1',
    maxWidth: 200, textAlign: 'right',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '6px 12px',
  },
  statCell: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8, padding: '5px 8px',
  },
  karmaBar: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 600,
  },
  karmaTrack: {
    flex: 1, height: 4,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  karmaFill: {
    height: '100%', borderRadius: 2,
    transition: 'width 0.5s ease, background 0.4s ease',
  },
  // ── Reporte Sentinel ─────────────────────────────────────────────────────
  reportBtn: {
    width: '100%',
    padding: '9px 0',
    borderRadius: 10,
    background: 'rgba(239,68,68,0.12)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.4)',
    fontWeight: 700, fontSize: 12,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },
  reportPanel: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  reportQuestion: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', fontWeight: 600,
  },
  reportGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
  },
  categoryBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '8px 4px', borderRadius: 9,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0', cursor: 'pointer',
    fontSize: 10, fontWeight: 600,
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11, cursor: 'pointer',
    textAlign: 'center', padding: '4px 0',
    fontFamily: 'inherit',
  },
  feedbackToast: {
    fontSize: 11, fontWeight: 600,
    padding: '7px 12px', borderRadius: 9,
    border: '1px solid',
    background: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
    animation: 'none',
  },
  arBtn: {
    width: '100%',
    padding: '9px 0',
    borderRadius: 10,
    background: 'rgba(245, 158, 11, 0.10)',
    color: '#fcd34d',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    fontWeight: 700, fontSize: 12,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },
};

