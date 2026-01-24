import React from 'react';
import { ShoppingBag, ArrowRight, Star, Clock, MapPin, X } from 'lucide-react';

/**
 * ProviderMapCard
 * 
 * A slide-up card that appears when a provider is discovered via proximity.
 * Features glassmorphism, category badges, and quick actions.
 */
const ProviderMapCard = ({ provider, onOpenDetails, onClose }) => {
    if (!provider) return null;

    const { name, category, distance, thumbnail, rating = 4.8 } = provider.properties;

    return (
        <div className="absolute bottom-6 left-6 right-6 z-30 animate-in slide-in-from-bottom-10 duration-700 ease-out">
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none"></div>

                <div className="flex gap-6 items-center">
                    {/* Image / Thumbnail */}
                    <div className="w-24 h-24 rounded-3xl overflow-hidden relative shrink-0 border border-white/10 shadow-lg">
                        <img
                            src={thumbnail || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200'}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 font-sans"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-black text-white">
                            <Star size={8} className="fill-yellow-400 text-yellow-400" />
                            {rating}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-500/20">
                                {category}
                            </span>
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <h4 className="text-xl font-black text-white truncate leading-tight tracking-tight uppercase italic underline decoration-emerald-500/30 decoration-2 underline-offset-4">
                            {name}
                        </h4>

                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">{distance}m de ti</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500 animate-pulse">
                                <Clock size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Abierto</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onOpenDetails(provider)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-3xl transition-all shadow-xl shadow-emerald-900/40 active:scale-90 group/btn"
                    >
                        <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Micro-interaction: Bottom Bar */}
                <div className="h-1 bg-emerald-500/30 w-full absolute bottom-0 left-0 transition-all duration-500 group-hover:bg-emerald-500/60"></div>
            </div>
        </div >
    );
};

export default ProviderMapCard;
