import React from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { Blurhash } from 'react-blurhash';

/**
 * ProviderMapCard
 * 
 * Componente que flota sobre el mapa con efecto Glassmorphism.
 * Muestra información del artesano o negocio descubierto.
 * Ahora incluye optimización de imágenes con Blurhash.
 */
const ProviderMapCard = ({ provider, onOpenDetails, onClose }) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    if (!provider) return null;

    const { name, category, thumbnail_url, blurhash } = provider.properties;

    // Lógica de colores según categoría
    const badgeConfig = {
        'gastronomy': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
        'artisan': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        'lodging': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'guide': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'default': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    const badgeStyle = badgeConfig[category] || badgeConfig.default;

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex items-center gap-4 relative group">
                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 bg-slate-800 border border-white/10 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors shadow-lg"
                >
                    <X size={14} />
                </button>

                {/* Foto Cuadrada Redondeada con Blurhash Fallback */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5 relative bg-slate-800">
                    {(!imageLoaded || imageError) && blurhash && (
                        <div className="absolute inset-0">
                            <Blurhash
                                hash={blurhash}
                                width="100%"
                                height="100%"
                                resolutionX={32}
                                resolutionY={32}
                                punch={1}
                            />
                        </div>
                    )}
                    <img
                        src={thumbnail_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200'}
                        alt={name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true); // Stop showing loading state
                        }}
                    />
                </div>

                {/* Información */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                            {category}
                        </span>
                    </div>
                    <h4 className="text-lg font-black text-white truncate leading-tight tracking-tight uppercase italic">
                        {name}
                    </h4>

                    {/* Botón Ver Oferta */}
                    <button
                        onClick={() => onOpenDetails(provider)}
                        className="mt-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 group/btn shadow-inner"
                    >
                        <ShoppingBag size={14} className="text-emerald-400 group-hover/btn:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ver Oferta</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProviderMapCard;
