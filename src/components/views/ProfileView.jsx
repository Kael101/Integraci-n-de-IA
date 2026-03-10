import React, { useState, useMemo } from 'react';
import { Settings, Award, Map, Download, Shield, LogOut, ChevronRight, Camera, Sparkles, LogIn, Bug, Plus, Coins, Leaf, Zap } from 'lucide-react';
import JIcon from '../ui/JIcon';
import OfflineManager from './OfflineManager';
import { useAuth } from '../../context/AuthContext';
import InsectScanner from '../entomology/InsectScanner';
import { useGamification } from '../../hooks/useGamification';
import { useJaguarCoins } from '../../hooks/useJaguarCoins';

const ProfileView = () => {
    const [showOfflineManager, setShowOfflineManager] = React.useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showRedeemResult, setShowRedeemResult] = useState(null);
    const [sightings, setSightings] = useState([]);
    const { user, loginWithGoogle, logout, passkeyAvailable, registerPasskey, loginWithPasskey } = useAuth();
    const { level, currentXP, xpToNext, progressPercent, karma, getWeeklyScore } = useGamification();
    const { balance: coinBalance, redeemCoins, earnFromKm, daysUntilFirstExpiry } = useJaguarCoins();

    // ── CO2 desde breadcrumbs ─────────────────────────────────────────────────
    const { totalKm, co2Kg, treesEquiv } = useMemo(() => {
        try {
            const breadcrumbs = JSON.parse(localStorage.getItem('jaguar_movement_history') || '[]');
            let dist = 0;
            for (let i = 1; i < breadcrumbs.length; i++) {
                const [lon1, lat1] = breadcrumbs[i - 1].coords;
                const [lon2, lat2] = breadcrumbs[i].coords;
                dist += _haversineKm(lat1, lon1, lat2, lon2);
            }
            const co2 = parseFloat((dist * 0.21).toFixed(1)); // kg/km IPCC factor
            return { totalKm: parseFloat(dist.toFixed(1)), co2Kg: co2, treesEquiv: Math.round(co2 / 21.7) };
        } catch {
            return { totalKm: 0, co2Kg: 0, treesEquiv: 0 };
        }
    }, []);

    const handleRedeem = () => {
        const result = redeemCoins(10);
        setShowRedeemResult(result);
        setTimeout(() => setShowRedeemResult(null), 3000);
    };

    // Si no hay usuario, mostrar pantalla de Login
    if (!user) {
        return (
            <div className="min-h-screen bg-jaguar-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-32 h-32 bg-gradient-to-tr from-jaguar-500 to-jaguar-900 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-jaguar-500/20">
                    <Shield size={64} className="text-black" />
                </div>
                <h1 className="font-display font-bold text-3xl text-white mb-2">Territorio Jaguar</h1>
                <p className="text-white/60 mb-8 max-w-xs">
                    Inicia sesión para guardar tu progreso, desbloquear insignias y acceder a mapas offline.
                </p>

                {/* Botón Google OAuth */}
                <button
                    onClick={loginWithGoogle}
                    className="flex items-center gap-3 bg-white text-jaguar-950 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors mb-4 w-full max-w-xs justify-center"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continuar con Google
                </button>

                {/* Botones WebAuthn — solo si el browser lo soporta */}
                {passkeyAvailable && (
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[10px] text-white/30 uppercase tracking-widest">o sin internet</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                        <button
                            onClick={loginWithPasskey}
                            className="w-full flex items-center gap-3 justify-center bg-jaguar-900/60 border border-jaguar-500/30 text-jaguar-300 font-bold py-4 px-8 rounded-xl hover:bg-jaguar-800/60 active:scale-95 transition-all"
                        >
                            <span className="text-lg">🪪</span>
                            Usar Huella / PIN (offline)
                        </button>
                        <button
                            onClick={() => registerPasskey(user?.displayName || 'Explorador Jaguar')}
                            className="w-full text-[10px] text-white/30 hover:text-white/50 transition-colors py-2"
                        >
                            + Registrar nueva passkey en este dispositivo
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const handleInsectCapture = (newInsect) => {
        setSightings(prev => [newInsect, ...prev]);
        // Aquí también guardaríamos en Firestore/LocalStorage
    };

    // Jerarquía de conservación — basada en XP acumulado total
    const _getRank = (xp) => {
        if (xp >= 500) return { name: 'Guardián Jaguar', icon: '🐆', color: 'text-jaguar-400' };
        if (xp >= 100) return { name: 'Guardián del Upano', icon: '💧', color: 'text-blue-400' };
        return { name: 'Explorador Activo', icon: '🥾', color: 'text-white/80' };
    };
    const rank = _getRank(currentXP);
    const weeklyXP = getWeeklyScore();

    // Datos derivados del usuario real + hooks
    const userData = {
        name: user.displayName || "Explorador Anónimo",
        rank,
        level,
        currentXP,
        xpToNext,
        progressPercent,
        karma,
        stats: {
            km: totalKm,
            routes: sightings.length,
            sightings: sightings.length,
            co2Kg,
        },
        photo: user.photoURL || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    };

    return (
        // Padding bottom grande para no chocar con el BottomNav
        <div className="min-h-screen bg-jaguar-950 pb-32 animate-fade-in overflow-y-auto">

            {/* SCANNER OVERLAY */}
            {showScanner && (
                <InsectScanner
                    onClose={() => setShowScanner(false)}
                    onCapture={handleInsectCapture}
                />
            )}

            {/* 1. HEADER CON GRADIATENTE DE FONDO */}
            <div className="relative h-48 bg-gradient-to-b from-jaguar-800 to-jaguar-950 overflow-hidden">
                {/* Decoración de fondo (Patrón abstracto) */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Ajustes (Tuerca) */}
                <button className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-transform">
                    <JIcon icon={Settings} variant="secondary" size={20} />
                </button>
            </div>

            {/* 2. TARJETA DE IDENTIDAD (Flotando sobre el header) */}
            <div className="px-6 -mt-16 relative z-10">
                <div className="flex flex-col items-center">

                    {/* Avatar con Anillo de Estado */}
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-jaguar-500 to-jaguar-900 shadow-2xl shadow-jaguar-500/30">
                            <img
                                src={userData.photo}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover border-4 border-jaguar-950"
                            />
                        </div>
                        {/* Badge de Nivel */}
                        <div className="absolute bottom-0 right-0 bg-jaguar-500 text-jaguar-950 font-bold text-xs px-2 py-1 rounded-full border border-jaguar-950 shadow-lg">
                            NVL {userData.level}
                        </div>
                    </div>

                    {/* Nombre y Rango */}
                    <h1 className="font-display font-bold text-2xl text-white tracking-wide">
                        {userData.name}
                    </h1>
                    <p className={`font-body text-sm tracking-widest uppercase mt-1 mb-2 font-bold ${userData.rank.color}`}>
                        {userData.rank.icon} {userData.rank.name}
                    </p>
                    {/* XP hasta el siguiente rango */}
                    {currentXP < 500 && (
                        <p className="text-[10px] text-white/30 mb-6">
                            {currentXP < 100
                                ? `${100 - currentXP} XP para Guardián del Upano`
                                : `${500 - currentXP} XP para Guardián Jaguar`}
                        </p>
                    )}
                    {currentXP >= 500 && <p className="text-[10px] text-jaguar-500/70 mb-6">🏆 Rango máximo alcanzado</p>}
                </div>

                {/* 3. GRID DE ESTADÍSTICAS */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <StatCard value={userData.stats.km} label="KM Totales" unit="km" />
                    <StatCard value={userData.stats.sightings} label="Avistamientos" unit="img" highlight />
                    <StatCard value={userData.stats.co2Kg} label="CO₂ Ahorrado" unit="kg" green />
                    <StatCard value={treesEquiv} label="Equiv. Árboles" unit="🌳" green />
                </div>

                {/* XP Progress bar + Leaderboard Semanal */}
                <div className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">XP — Nivel {userData.level}</span>
                        <span className="text-[10px] text-jaguar-400 font-bold">{userData.currentXP} / {userData.xpToNext + userData.currentXP}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-jaguar-500 to-amber-400 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, userData.progressPercent)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className={`text-[9px] font-bold ${userData.karma < 20 ? 'text-red-400' :
                                userData.karma < 50 ? 'text-yellow-400' : 'text-white/30'
                            }`}>Karma: {userData.karma}/200</span>
                        {weeklyXP > 0 && (
                            <span className="text-[9px] text-jaguar-400 font-bold">⚡ {weeklyXP} XP esta semana</span>
                        )}
                    </div>
                </div>

                {/* JAGUAR COINS — Garras de Oro */}
                <div className="mb-8 bg-gradient-to-br from-amber-950/60 to-jaguar-950 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <span className="text-base">🪙</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">Garras de Oro</p>
                                <p className="font-black text-xl text-amber-400">{coinBalance} <span className="text-xs text-amber-500/60 font-medium">Jaguar Coins</span></p>
                            </div>
                        </div>
                        {daysUntilFirstExpiry() !== null && (
                            <span className="text-[9px] text-white/30 text-right">Vence en<br />{daysUntilFirstExpiry()}d</span>
                        )}
                    </div>
                    {showRedeemResult && (
                        <div className={`text-xs font-bold px-3 py-2 rounded-xl mb-2 text-center animate-in slide-in-from-bottom ${showRedeemResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {showRedeemResult.success
                                ? `✅ ¡${showRedeemResult.discountPct}% de descuento activado!`
                                : `⚠️ ${showRedeemResult.reason}`}
                        </div>
                    )}
                    <button
                        onClick={handleRedeem}
                        disabled={coinBalance < 10}
                        className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                            disabled:opacity-30 disabled:cursor-not-allowed
                            enabled:bg-amber-500/10 enabled:border-amber-500/30 enabled:text-amber-400
                            enabled:hover:bg-amber-500/20 enabled:active:scale-95"
                    >
                        Canjear 10 coins → 10% descuento
                    </button>
                    <p className="text-[9px] text-white/20 text-center mt-2">1 coin = 1% descuento · máx 30% · vence en {daysUntilFirstExpiry() ?? '—'}d</p>
                </div>

                {/* 3.5. COLECCIÓN DE INSECTOS (ENTOMOTURISMO) */}
                {sightings.length > 0 && (
                    <div className="mb-8">
                        <SectionTitle title="Colección Entomológica" />
                        <div className="grid grid-cols-2 gap-3">
                            {sightings.map((insect, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2 relative overflow-hidden group">
                                    <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                                        <img src={insect.image} alt={insect.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md text-[10px] text-white px-1.5 py-0.5 rounded font-bold">
                                            {Math.round(insect.confidence * 100)}%
                                        </div>
                                    </div>
                                    <h4 className="text-white font-bold text-sm leading-tight">{insect.name}</h4>
                                    <span className="text-xs text-white/50">{insect.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* 3.6. DASHBOARD: ESTADO DEL PROYECTO (GAD) */}
                <div className="mb-8">
                    <SectionTitle title="Estado del Proyecto: Plan Piloto" />
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden">

                        {/* Mapa Táctico Simulado (CSS) */}
                        <div className="h-32 bg-jaguar-900/50 rounded-xl relative border border-white/5 mb-3 overflow-hidden">
                            {/* Silueta abstracta mapa (solo decorativa) */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Morona_Santiago_in_Ecuador_%28%2Btierra%29.svg/1200px-Morona_Santiago_in_Ecuador_%28%2Btierra%29.svg.png')] bg-cover bg-center mix-blend-overlay"></div>

                            {/* Pin Macas (Activo) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-[9px] font-black text-white bg-black/50 px-1 rounded backdrop-blur-md">MACAS (ACTIVO)</span>
                            </div>

                            {/* Pines Grises (Próxima Fase) */}
                            <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white/20 rounded-full"></div>
                            <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-white/20 rounded-full"></div>
                            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/20 rounded-full"></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-white font-bold">Fase 1: Despliegue Inicial</span>
                                <span className="text-[10px] text-white/50">Cobertura: 85% de la zona urbana</span>
                            </div>
                            <div className="h-2 w-16 bg-white/10 rounded-full overflow-hidden">
                                <div className="bg-green-500 w-[85%] h-full rounded-full shadows-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. SECCIONES DE MENÚ */}
                <div className="space-y-6">

                    {/* Sección: Gestión Offline (Prioridad Alta) */}
                    <SectionTitle title="Centro de Comando" />
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <MenuRow
                            icon={Download}
                            title="Mapas Offline"
                            subtitle="2 zonas descargadas (150 MB)"
                            action={<ChevronRight size={16} className="text-white/20" />}
                            onClick={() => setShowOfflineManager(true)}
                        />
                        <div className="h-[1px] bg-white/5 mx-4" /> {/* Divisor */}
                        <MenuRow
                            icon={Award}
                            title="Mis Insignias"
                            subtitle="Ver colección de logros"
                        />
                    </div>

                    {/* Sección: Cuenta y Seguridad */}
                    <SectionTitle title="Sistema" />
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <MenuRow
                            icon={Shield}
                            title="Seguridad y Permisos"
                        />
                        <div className="h-[1px] bg-white/5 mx-4" />
                        <MenuRow
                            icon={LogOut}
                            title="Cerrar Sesión"
                            variant="danger"
                            noArrow
                            onClick={logout}
                        />
                    </div>

                </div>

                {/* Versión de la App (Pie de página) */}
                <div className="text-center mt-12 mb-6">
                    <p className="text-white/20 text-[10px] font-mono">
                        TERRITORIO JAGUAR v1.1.0 (PROD) <br />
                        UID: {user.uid.slice(0, 8)}...
                    </p>
                </div>

            </div>

            {/* FAB: NUEVO REGISTRO (ENTOMOTURISMO) */}
            <button
                onClick={() => setShowScanner(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-jaguar-500 rounded-full flex items-center justify-center text-jaguar-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-110 active:scale-95 transition-all z-40 animate-bounce-custom"
            >
                <Camera size={24} strokeWidth={2.5} />
            </button>
        </div>
    );
};

// --- SUB-COMPONENTES PARA MANTENER EL CÓDIGO LIMPIO ---

const StatCard = ({ value, label, unit, highlight, green }) => (
    <div className={`flex flex-col items-center p-3 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${green ? 'bg-emerald-500/10 border-emerald-500/30' :
        highlight ? 'bg-jaguar-500/10 border-jaguar-500/30' :
            'bg-white/5 border-white/5'
        }`}>
        <div className="flex items-baseline gap-1">
            <span className={`text-xl font-display font-bold ${green ? 'text-emerald-400' : highlight ? 'text-jaguar-400' : 'text-white'
                }`}>
                {value}
            </span>
            <span className="text-[10px] text-white/40">{unit}</span>
        </div>
        <span className="text-[10px] text-white/50 uppercase tracking-wide mt-1">{label}</span>
    </div>
);

const SectionTitle = ({ title }) => (
    <h3 className="text-white/40 text-xs font-display font-bold tracking-widest uppercase pl-2 mb-2">
        {title}
    </h3>
);

const MenuRow = ({ icon, title, subtitle, action, variant = 'default', noArrow, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors group"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-rose-500/10' : 'bg-jaguar-900/50'}`}>
                <JIcon
                    icon={icon}
                    variant={variant === 'danger' ? 'danger' : 'primary'}
                    size={20}
                />
            </div>
            <div className="text-left">
                <p className={`font-body font-medium text-sm ${variant === 'danger' ? 'text-rose-400' : 'text-gray-200'}`}>
                    {title}
                </p>
                {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
            </div>
        </div>

        <div className="flex items-center gap-3">
            {action}
            {!noArrow && <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />}
        </div>
    </button>
);

export default ProfileView;

// ─ Haversine (helper privado) ─────────────────────────────────────────────
// Cálcula distancia en km entre 2 coordenadas (fórmula Haversine).
const _haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
