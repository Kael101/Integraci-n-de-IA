import { Settings, Award, Map, Download, Shield, LogOut, ChevronRight, Camera, Sparkles } from 'lucide-react';
import JIcon from '../ui/JIcon';
import OfflineManager from './OfflineManager';

const ProfileView = () => {
    const [showOfflineManager, setShowOfflineManager] = React.useState(false);
    // Datos simulados del usuario (luego vendrán de tu Backend/Auth)
    const user = {
        name: "Mateo Explorador",
        rank: "Guardián del Upano", // Título gamificado
        level: 3,
        stats: {
            km: 42.5,     // Kilómetros recorridos
            routes: 8,    // Rutas completadas
            sightings: 12 // Especies registradas/fotografiadas
        }
    };

    return (
        // Padding bottom grande para no chocar con el BottomNav
        <div className="min-h-screen bg-jaguar-950 pb-32 animate-fade-in overflow-y-auto">

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
                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover border-4 border-jaguar-950"
                            />
                        </div>
                        {/* Badge de Nivel */}
                        <div className="absolute bottom-0 right-0 bg-jaguar-500 text-jaguar-950 font-bold text-xs px-2 py-1 rounded-full border border-jaguar-950 shadow-lg">
                            NVL {user.level}
                        </div>
                    </div>

                    {/* Nombre y Rango */}
                    <h1 className="font-display font-bold text-2xl text-white tracking-wide">
                        {user.name}
                    </h1>
                    <p className="text-jaguar-400 font-body text-sm tracking-widest uppercase mt-1 mb-6">
                        {user.rank}
                    </p>
                </div>

                {/* 3. GRID DE ESTADÍSTICAS (Glassmorphism) */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <StatCard value={user.stats.km} label="KM Totales" unit="km" />
                    <StatCard value={user.stats.routes} label="Rutas" unit="#" />
                    <StatCard value={user.stats.sightings} label="Avistamientos" unit="img" highlight />
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
                            title="Desconectar Enlace"
                            variant="danger"
                            noArrow
                        />
                    </div>

                </div>

                {/* Versión de la App (Pie de página) */}
                <div className="text-center mt-12 mb-6">
                    <p className="text-white/20 text-[10px] font-mono">
                        TERRITORIO JAGUAR v1.0.4 (BETA) <br />
                        ID DISPOSITIVO: 884-FJA-29
                    </p>
                </div>

            </div>
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
