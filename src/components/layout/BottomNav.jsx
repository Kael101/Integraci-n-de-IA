import React from 'react';
import { Map, Compass, User, ScanLine, ShoppingBag, BookOpen } from 'lucide-react'; // Importamos iconos de Lucide
import JIcon from '../ui/JIcon'; // Tu componente de iconos personalizado

const BottomNav = ({ activeTab, onTabChange }) => {

    return (
        <div className="fixed bottom-6 left-4 right-4 z-40">
            {/* CONTENEDOR GLASSMORPHISM FLOTANTE 
         - backdrop-blur-xl: El desenfoque fuerte premium
         - bg-jaguar-950/80: Fondo oscuro semitransparente
         - border-white/10: El borde sutil de cristal
      */}
            <nav className="flex items-center justify-around px-2 py-4 rounded-2xl bg-jaguar-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">

                {/* Pasaporte (Nuevo) */}
                <button
                    onClick={() => onTabChange('passport')}
                    className="flex flex-col items-center gap-1 group w-14"
                >
                    <JIcon
                        icon={BookOpen}
                        variant={activeTab === 'passport' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[9px] font-body tracking-wider ${activeTab === 'passport' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        PASAPORTE
                    </span>
                </button>

                {/* Mercado */}
                <button
                    onClick={() => onTabChange('market')}
                    className="flex flex-col items-center gap-1 group w-14"
                >
                    <JIcon
                        icon={ShoppingBag}
                        variant={activeTab === 'market' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[9px] font-body tracking-wider ${activeTab === 'market' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        MERCADO
                    </span>
                </button>

                {/* BOTÓN CENTRAL: "ACCIÓN JAGUAR" (El Mapa/Escaner) 
           Este botón rompe la simetría y destaca. Es el "Botón de Inicio".
        */}
                <div className="relative -mt-12 group cursor-pointer" onClick={() => onTabChange('map')}>
                    {/* Efecto de "Resplandor" detrás del botón */}
                    <div className="absolute inset-0 bg-jaguar-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>

                    <div className="relative bg-gradient-to-br from-jaguar-800 to-jaguar-950 p-4 rounded-full border border-jaguar-500/50 shadow-lg shadow-jaguar-500/20 active:scale-95 transition-all duration-300">
                        <JIcon
                            icon={Map}
                            variant="primary"
                            size={28}
                            className="text-white"
                        />
                    </div>
                </div>

                {/* Explorar (Antes Izquierda) */}
                <button
                    onClick={() => onTabChange('explore')}
                    className="flex flex-col items-center gap-1 group w-14"
                >
                    <JIcon
                        icon={Compass}
                        variant={activeTab === 'explore' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[9px] font-body tracking-wider ${activeTab === 'explore' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        EXPLORAR
                    </span>
                </button>

                {/* Perfil */}
                <button
                    onClick={() => onTabChange('profile')}
                    className="flex flex-col items-center gap-1 group w-14"
                >
                    <JIcon
                        icon={User}
                        variant={activeTab === 'profile' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[9px] font-body tracking-wider ${activeTab === 'profile' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        PERFIL
                    </span>
                </button>

            </nav>
        </div>
    );
};

export default BottomNav;
