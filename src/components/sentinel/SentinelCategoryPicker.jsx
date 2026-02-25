import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * SentinelCategoryPicker
 * ─────────────────────────────────────────────────────────────────────────────
 * Tres tarjetas grandes para categorizar el tipo de amenaza ambiental.
 */
const CATEGORIES = [
    {
        id: 'deforestation',
        emoji: '🌳',
        label: 'Tala / Deforestación',
        desc: 'Corte de árboles, quema de bosque, apertura de caminos ilegales.',
        color: 'from-green-600/20 to-green-900/20',
        border: 'border-green-500/30',
        badge: 'bg-green-500/20 text-green-300'
    },
    {
        id: 'machinery',
        emoji: '🏗️',
        label: 'Maquinaria Pesada / Dragas',
        desc: 'Retroexcavadoras, dragas fluviales, campamentos mineros ilegales.',
        color: 'from-orange-600/20 to-orange-900/20',
        border: 'border-orange-500/30',
        badge: 'bg-orange-500/20 text-orange-300'
    },
    {
        id: 'water_pollution',
        emoji: '💧',
        label: 'Contaminación de Río',
        desc: 'Cambio de color del agua, espuma, derrames de mercurio o aceite.',
        color: 'from-blue-600/20 to-blue-900/20',
        border: 'border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-300'
    }
];

const SentinelCategoryPicker = ({ onSelect, onBack }) => {
    return (
        <div className="fixed inset-0 z-[95] bg-jaguar-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/5">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">Paso 2 de 3</p>
                    <h2 className="text-lg font-black uppercase italic text-white">¿Qué tipo de amenaza?</h2>
                </div>
            </div>

            {/* Categorías */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`w-full text-left bg-gradient-to-br ${cat.color} border ${cat.border} rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:brightness-125 group`}
                    >
                        <div className="flex items-start gap-4">
                            <span className="text-5xl leading-none group-hover:scale-110 transition-transform">{cat.emoji}</span>
                            <div className="flex-1">
                                <h3 className="font-black uppercase italic text-white text-lg leading-tight mb-1">
                                    {cat.label}
                                </h3>
                                <p className="text-[12px] text-white/60 leading-relaxed">
                                    {cat.desc}
                                </p>
                            </div>
                            {/* Flecha */}
                            <div className={`mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cat.badge} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                Elegir
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Nota de seguridad inferior */}
            <div className="p-4 text-center">
                <p className="text-[10px] text-white/30 font-medium">
                    🔒 Tu selección se cifra junto con la imagen — nadie más puede leerla
                </p>
            </div>
        </div>
    );
};

export default SentinelCategoryPicker;
