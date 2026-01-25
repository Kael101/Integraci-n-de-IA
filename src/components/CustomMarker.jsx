import React from 'react';
import { Utensils, Palette, Tent, Compass, MapPin, Sparkles } from 'lucide-react';

/**
 * CustomMarker Component
 * Renders specialized markers for the MapCanvas with category-specific icons and Tailwind animations.
 */
const CustomMarker = ({ type, category, label }) => {

    // Configuración de iconos y colores por categoría
    const categoryConfig = {
        gastronomy: {
            icon: <Utensils size={18} />,
            bgColor: 'bg-amber-500',
            pingColor: 'bg-amber-400',
            textColor: 'text-amber-500',
            description: 'Gastronomía'
        },
        artisan: {
            icon: <Palette size={18} />,
            bgColor: 'bg-violet-500',
            pingColor: 'bg-violet-400',
            textColor: 'text-violet-500',
            description: 'Artesanía'
        },
        lodging: {
            icon: <Tent size={18} />,
            bgColor: 'bg-emerald-600',
            pingColor: 'bg-emerald-400',
            textColor: 'text-emerald-500',
            description: 'Alojamiento'
        },
        guide: {
            icon: <Compass size={18} />,
            bgColor: 'bg-blue-500',
            pingColor: 'bg-blue-400',
            textColor: 'text-blue-500',
            description: 'Guía Jaguar'
        },
        jaguar: {
            icon: <Sparkles size={18} className="animate-pulse" />,
            bgColor: 'bg-amber-500',
            pingColor: 'bg-amber-400',
            textColor: 'text-amber-500',
            description: 'Avistamiento Reciente'
        },
        default: {
            icon: <MapPin size={18} />,
            bgColor: 'bg-slate-600',
            pingColor: 'bg-slate-400',
            textColor: 'text-slate-500',
            description: 'Interés'
        }
    };

    const current = type === 'jaguar' ? categoryConfig.jaguar : (categoryConfig[category] || categoryConfig.default);

    return (
        <div className="group relative flex flex-col items-center">
            {/* Efecto de Pulso (Ping) para alertas críticas o avistamientos */}
            {type === 'jaguar' && (
                <div className={`absolute -inset-2 ${current.pingColor}/30 rounded-full animate-ping ring-2 ring-amber-500/20`}></div>
            )}

            {/* Icono Principal */}
            <div className={`relative z-10 ${current.bgColor} p-2.5 rounded-full text-white shadow-xl border-2 border-white/50 transform group-hover:scale-110 transition-transform duration-300`}>
                {current.icon}
            </div>

            {/* Tooltip / Etiqueta */}
            <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl min-w-[120px] text-center">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none mb-0.5">{label}</p>
                    <p className={`text-[8px] font-bold ${current.textColor} uppercase tracking-[0.2em] leading-none`}>
                        {current.description}
                    </p>
                </div>
            </div>

            {/* Sombra / Base */}
            <div className="mt-1 w-4 h-[2px] bg-black/40 rounded-full blur-[1px]"></div>
        </div>
    );
};

export default CustomMarker;
