// src/components/map/ArchaeologicalCard.jsx
import React from 'react';
import { Landmark, History, Gem, X } from 'lucide-react';

const ArchaeologicalCard = ({ site, onClose }) => {
    if (!site) return null;

    return (
        <div className="absolute bottom-24 left-4 right-4 bg-jaguar-950/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-0 overflow-hidden shadow-2xl animate-slide-up z-50">
            {/* Header Imagen (Mockup 3D) */}
            <div className="relative h-32 bg-gradient-to-r from-amber-900 to-black">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.world-archaeology.com/wp-content/uploads/2024/01/Upano-Lidar.jpg")' }}></div>
                <div className="absolute top-3 right-3">
                    <button onClick={onClose} className="bg-black/40 rounded-full p-1 text-white hover:bg-white/20">
                        <X size={20} />
                    </button>
                </div>
                <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Landmark size={16} className="text-amber-400" />
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Ecos del Upano</span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-white">{site.name}</h3>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-5">
                <p className="text-white/80 text-sm leading-relaxed mb-4 font-body">
                    {site.description} <br />
                    <span className="text-white/40 italic text-xs mt-1 block">Datación estimada: {site.era || '2.500 años AP'}</span>
                </p>

                {/* Gamificación */}
                <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/50 transition-all active:scale-95 border border-amber-400/20">
                    <Gem size={18} className="text-amber-200" />
                    <span>Coleccionar Glifo Ancestral</span>
                </button>
            </div>
        </div>
    );
};

export default ArchaeologicalCard;
