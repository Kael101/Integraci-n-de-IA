import React, { useState } from 'react';
import { Settings, Award, Map, Download, Shield, LogOut, ChevronRight, Camera, Sparkles, LogIn, Bug, Plus } from 'lucide-react';
import JIcon from '../ui/JIcon';
import OfflineManager from './OfflineManager';
import { useAuth } from '../../context/AuthContext';
import InsectScanner from '../entomology/InsectScanner';

const ProfileView = () => {
    const [showOfflineManager, setShowOfflineManager] = React.useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [sightings, setSightings] = useState([]); // Colección local temporal
    const { user, loginWithGoogle, logout } = useAuth();

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
                <button
                    onClick={loginWithGoogle}
                    className="flex items-center gap-3 bg-white text-jaguar-950 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continuar con Google
                </button>
            </div>
        );
    }

    const handleInsectCapture = (newInsect) => {
        setSightings(prev => [newInsect, ...prev]);
        // Aquí también guardaríamos en Firestore/LocalStorage
    };

    // Datos derivados del usuario real + estado local
    const userData = {
        name: user.displayName || "Explorador Anónimo",
        rank: "Guardián del Upano",
        level: 1,
        stats: {
            km: 0,
            routes: 0,
            sightings: sightings.length // Conectado al estado real
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
                    <p className="text-jaguar-400 font-body text-sm tracking-widest uppercase mt-1 mb-6">
                        {userData.rank}
                    </p>
                </div>

                {/* 3. GRID DE ESTADÍSTICAS (Glassmorphism) */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <StatCard value={userData.stats.km} label="KM Totales" unit="km" />
                    <StatCard value={userData.stats.routes} label="Rutas" unit="#" />
                    <StatCard value={userData.stats.sightings} label="Avistamientos" unit="img" highlight />
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

const StatCard = ({ value, label, unit, highlight }) => (
    <div className={`flex flex-col items-center p-3 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${highlight ? 'bg-jaguar-500/10 border-jaguar-500/30' : 'bg-white/5 border-white/5'}`}>
        <div className="flex items-baseline gap-1">
            <span className={`text-xl font-display font-bold ${highlight ? 'text-jaguar-400' : 'text-white'}`}>
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
