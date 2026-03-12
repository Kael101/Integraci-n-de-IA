/**
 * LeaderboardView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tabla de clasificación semanal para Territorio Jaguar.
 *
 * LÓGICA CLAVE:
 *  - Solo compite el XP ganado en los últimos 7 días (weeklyXP).
 *  - El XP total nunca se borra del perfil; solo el semanal se reinicia.
 *  - Los usuarios con weeklyXP = 0 se filtran automáticamente.
 *  - El usuario actual se resalta con un borde verde semitransparente.
 *  - Los íconos de rango (🥾/💧/🐆) se calculan desde el XP total —
 *    así, un Explorador puede ganar la semana, pero su rango queda visible.
 *
 * DATOS:
 *  - mockLeaderboardData: simulados. En producción → Firestore query:
 *      collection('users').orderBy('gamification.weeklyXP','desc').limit(50)
 *  - weeklyXP propio: viene de useGamification().getWeeklyScore()
 *  - currentXP propio: viene de useGamification().currentXP
 */
import React, { useMemo } from 'react';
import { Trophy, Flame, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../hooks/useGamification';

// ─── Constantes de rango ────────────────────────────────────────────────────
// Espejamos exactamente la misma jerarquía de ProfileView para coherencia visual.
const getRankBadge = (totalXP) => {
    if (totalXP >= 5000) return { icon: '🐆', label: 'Guardián Jaguar', color: 'text-jaguar-400' };
    if (totalXP >= 1500) return { icon: '💧', label: 'Guardián del Upano', color: 'text-blue-400' };
    return { icon: '🥾', label: 'Explorador', color: 'text-white/70' };
};

// Medallas del podio (Top 3)
const MEDALS = ['🥇', '🥈', '🥉'];

// ─── Datos simulados ─────────────────────────────────────────────────────────
// En producción, reemplazar con un hook useLeaderboard() que haga la consulta
// a Firestore. La shape de cada objeto debe mantenerse idéntica.
const MOCK_USERS = [
    { id: 'user_101', name: 'MashiRunner',     weeklyXP: 850, totalXP: 5200 },
    { id: 'user_102', name: 'EcoRuta_MS',      weeklyXP: 620, totalXP: 1800 },
    { id: 'user_103', name: 'SelvaTracker',    weeklyXP: 410, totalXP: 980  },
    { id: 'user_104', name: 'AmazonLover',     weeklyXP: 150, totalXP: 450  },
    { id: 'user_105', name: 'CondorPath',      weeklyXP: 90,  totalXP: 3100 },
    { id: 'user_106', name: 'TuristaInactivo', weeklyXP: 0,   totalXP: 1200 }, // Filtrado automáticamente
];

// ─── Componente ──────────────────────────────────────────────────────────────

const LeaderboardView = () => {
    const { user } = useAuth();
    const { getWeeklyScore, currentXP } = useGamification();

    const myWeeklyXP = getWeeklyScore();
    const myTotalXP  = currentXP;

    // Construir la lista completa: mock externo + entrada propia del usuario autenticado
    const leaderboardData = useMemo(() => {
        if (!user) return MOCK_USERS;
        // Buscar si ya hay una entrada para el usuario actual (no en los mock dados)
        const meEntry = {
            id: user.uid,
            name: user.displayName || 'Tú',
            weeklyXP: myWeeklyXP,
            totalXP: myTotalXP,
            isMe: true,
        };
        // Añadir al usuario real; eliminar posible placeholder duplicado
        return [...MOCK_USERS.filter(u => u.id !== user.uid), meEntry];
    }, [user, myWeeklyXP, myTotalXP]);

    // Filtrar inactivos y ordenar descendente por weeklyXP
    const rankedUsers = useMemo(() =>
        leaderboardData
            .filter(u => u.weeklyXP > 0)
            .sort((a, b) => b.weeklyXP - a.weeklyXP),
        [leaderboardData]
    );

    // Posición del usuario actual en el ranking
    const myPosition = rankedUsers.findIndex(u => u.id === user?.uid) + 1;

    // ── Días hasta el reset (domingo más próximo) ────────────────────────────
    const daysUntilReset = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); // 0=Dom, 1=Lun...
        return day === 0 ? 7 : 7 - day;
    }, []);

    return (
        <div className="min-h-screen bg-jaguar-950 pb-32 animate-fade-in overflow-y-auto">

            {/* ── HEADER ── */}
            <div className="relative overflow-hidden">
                {/* Gradiente de fondo decorativo */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 to-jaguar-950 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

                <div className="relative px-6 pt-14 pb-8 text-center">
                    {/* Icono de Trofeo animado */}
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                        <Trophy size={32} className="text-amber-400" />
                    </div>

                    <h1 className="font-display font-black text-2xl text-white tracking-wide mb-1">
                        Ranking Semanal
                    </h1>
                    <p className="text-white/40 text-sm">
                        Los mayores protectores del bosque esta semana
                    </p>

                    {/* Indicador de posición propia */}
                    {user && myPosition > 0 && (
                        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Flame size={14} className="text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-bold">
                                Tu posición: #{myPosition} · {myWeeklyXP} XP esta semana
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 space-y-4">

                {/* ── LISTA DE CLASIFICACIÓN ── */}
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                    {rankedUsers.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl mb-3">🌿</p>
                            <p className="text-white/50 text-sm font-medium">
                                Nadie ha explorado aún esta semana.
                            </p>
                            <p className="text-white/30 text-xs mt-1">¡Sé el primero en trazar una ruta!</p>
                        </div>
                    ) : (
                        rankedUsers.map((entry, index) => {
                            const isMe = entry.id === user?.uid || entry.isMe;
                            const rank = getRankBadge(entry.totalXP);
                            const isTopThree = index < 3;

                            return (
                                <React.Fragment key={entry.id}>
                                    <div
                                        className={`flex items-center gap-3 px-4 py-4 transition-colors ${
                                            isMe
                                                ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                                                : 'hover:bg-white/5'
                                        }`}
                                    >
                                        {/* Posición / Medalla */}
                                        <div className={`w-9 flex-shrink-0 text-center ${
                                            isTopThree ? 'text-2xl' : 'text-white/40 font-bold font-mono text-sm'
                                        }`}>
                                            {isTopThree ? MEDALS[index] : `#${index + 1}`}
                                        </div>

                                        {/* Avatar con Rango */}
                                        <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xl
                                            ${isTopThree
                                                ? 'bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-white/10'
                                                : 'bg-white/5 border border-white/5'
                                            }`}
                                        >
                                            {rank.icon}
                                        </div>

                                        {/* Nombre + Rango */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${
                                                isMe ? 'text-emerald-300' : 'text-white'
                                            }`}>
                                                {entry.name}
                                                {isMe && (
                                                    <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                        Tú
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${rank.color}`}>
                                                {rank.label}
                                            </div>
                                        </div>

                                        {/* XP Semanal */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={`font-black text-lg leading-none ${
                                                isTopThree ? 'text-jaguar-400' : 'text-white/80'
                                            }`}>
                                                {entry.weeklyXP.toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-widest">
                                                XP / sem
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divisor — solo entre filas, no al final */}
                                    {index < rankedUsers.length - 1 && (
                                        <div className="h-px bg-white/5 mx-4" />
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

                {/* ── TARJETA DE RESET SEMANAL ── */}
                <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <div className="mt-0.5">
                        <RefreshCw size={14} className="text-blue-400 flex-shrink-0" />
                    </div>
                    <div>
                        <p className="text-blue-300 text-xs font-bold mb-0.5">
                            Reset en {daysUntilReset} día{daysUntilReset !== 1 ? 's' : ''} (domingo 23:59)
                        </p>
                        <p className="text-white/30 text-[11px] leading-relaxed">
                            El ranking semanal se reinicia cada domingo. Tu XP total del perfil
                            y tus Jaguar Coins nunca se borran.
                        </p>
                    </div>
                </div>

                {/* ── TARJETA INFORMATIVA: Cómo ganar XP ── */}
                <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl mb-4">
                    <Info size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                            <strong className="text-white/70">¿Cómo subir posiciones?</strong>{' '}
                            Registra rutas, valida reportes Sentinela y desbloquea sellos del Pasaporte.
                            Cada acción suma XP esta semana.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LeaderboardView;
