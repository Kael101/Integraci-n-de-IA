import React, { useState } from 'react';
import { Map, Compass, User, ScanLine, ShoppingBag } from 'lucide-react'; // Importamos iconos de Lucide
import JIcon from '../ui/JIcon'; // Tu componente de iconos personalizado

const BottomNav = () => {
    const [activeTab, setActiveTab] = useState('map');

    // Configuración de los botones
    const navItems = [
        { id: 'explore', icon: Compass, label: 'Explorar' },
        { id: 'map', icon: Map, label: 'Mapa' }, // El central será especial
        { id: 'profile', icon: User, label: 'Perfil' },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-40">
            {/* CONTENEDOR GLASSMORPHISM FLOTANTE 
         - backdrop-blur-xl: El desenfoque fuerte premium
         - bg-jaguar-950/80: Fondo oscuro semitransparente
         - border-white/10: El borde sutil de cristal
      */}
            <nav className="flex items-center justify-around px-6 py-4 rounded-2xl bg-jaguar-950/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">

                {/* Lado Izquierdo: Explorar */}
                <button
                    onClick={() => setActiveTab('explore')}
                    className="flex flex-col items-center gap-1 group"
                >
                    <JIcon
                        icon={Compass}
                        variant={activeTab === 'explore' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[10px] font-body tracking-wider ${activeTab === 'explore' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        EXPLORAR
                    </span>
                </button>

                {/* Mercado */}
                <button
                    onClick={() => setActiveTab('market')}
                    className="flex flex-col items-center gap-1 group"
                >
                    <JIcon
                        icon={ShoppingBag}
                        variant={activeTab === 'market' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[10px] font-body tracking-wider ${activeTab === 'market' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        MERCADO
                    </span>
                </button>

                {/* BOTÓN CENTRAL: "ACCIÓN JAGUAR" (El Mapa/Escaner) 
           Este botón rompe la simetría y destaca. Es el "Botón de Inicio".
        */}
                <div className="relative -mt-12 group cursor-pointer" onClick={() => setActiveTab('map')}>
                    {/* Efecto de "Resplandor" detrás del botón */}
                    <div className="absolute inset-0 bg-jaguar-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>

                    <div className="relative bg-gradient-to-br from-jaguar-800 to-jaguar-950 p-4 rounded-full border border-jaguar-500/50 shadow-lg shadow-jaguar-500/20 active:scale-95 transition-all duration-300">
                        <JIcon
                            icon={ScanLine} // Usamos ScanLine o Map para dar sensación de tecnología
                            variant="primary"
                            size={28}
                            className="text-white" // Forzamos blanco o dorado según prefieras
                        />
                    </div>
                </div>

                {/* Lado Derecho: Perfil */}
                <button
                    onClick={() => setActiveTab('profile')}
                    className="flex flex-col items-center gap-1 group"
                >
                    <JIcon
                        icon={User}
                        variant={activeTab === 'profile' ? 'primary' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-[10px] font-body tracking-wider ${activeTab === 'profile' ? 'text-jaguar-500' : 'text-white/50'}`}>
                        PERFIL
                    </span>
                </button>

            </nav>
        </div>
    );
};

export default BottomNav;
