import React from 'react';
import { X, Clock, Mountain, Footprints, Play } from 'lucide-react';
import JIcon from '../ui/JIcon';

const RouteDetailCard = ({ route, onClose }) => {
    if (!route) return null;

    return (
        // CONTENEDOR FLOTANTE
        // bottom-[110px]: Calculado para flotar justo encima de tu BottomNav
        <div className="absolute bottom-[110px] left-4 right-4 z-30 animate-slide-up">

            {/* EFECTO CRISTAL (GLASSMORPHISM) */}
            <div className="bg-jaguar-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/60 relative overflow-hidden">

                {/* DECORACIÓN DE FONDO (Glow sutil) */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-jaguar-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                {/* 1. CABECERA: Título y Cerrar */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[10px] text-jaguar-400 font-display tracking-widest uppercase mb-1 block">
                            RUTA SELECCIONADA
                        </span>
                        <h2 className="font-display font-bold text-xl text-white leading-tight pr-4">
                            {route.title || "Sendero del Río Upano"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={16} className="text-white/60" />
                    </button>
                </div>

                {/* 2. GRID DE DATOS (El Dashboard) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* Tiempo */}
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center border border-white/5">
                        <JIcon icon={Clock} variant="secondary" size={18} className="mb-1" />
                        <span className="text-white font-display font-bold text-sm">{route.time || "45m"}</span>
                        <span className="text-[10px] text-white/40">Duración</span>
                    </div>

                    {/* Distancia */}
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center border border-white/5">
                        <JIcon icon={Footprints} variant="secondary" size={18} className="mb-1" />
                        <span className="text-white font-display font-bold text-sm">{route.dist || "2.4km"}</span>
                        <span className="text-[10px] text-white/40">Distancia</span>
                    </div>

                    {/* Desnivel / Dificultad */}
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center border border-white/5">
                        <JIcon icon={Mountain} variant="secondary" size={18} className="mb-1" />
                        <span className="text-jaguar-400 font-display font-bold text-sm">{route.level || "Media"}</span>
                        <span className="text-[10px] text-white/40">Nivel</span>
                    </div>
                </div>

                {/* 3. DESCRIPCIÓN CORTA */}
                <p className="text-sm text-gray-300 font-body leading-relaxed mb-4 line-clamp-2">
                    {route.desc || "Un recorrido inmersivo bajando desde Macas hasta las orillas del Upano."}
                </p>

                {/* 3.5. AFILIADOS EN EL CAMINO (Discovery) */}
                {route.affiliates && route.affiliates.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <span className="text-[9px] text-jaguar-500 font-display font-bold tracking-widest uppercase block border-b border-jaguar-500/20 pb-1">
                            Afiliados en el Trayecto {route.isLoadingAffiliates && "(Buscando más...)"}
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                            {route.affiliates.map((aff, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${aff.isJaguar ? 'bg-jaguar-500/10 border-jaguar-500/30' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <span className="text-white text-xs font-bold font-display">{aff.name}</span>
                                            {aff.isJaguar && <span className="text-[7px] bg-jaguar-500 text-jaguar-950 px-1 rounded-sm font-black uppercase">JAGUAR</span>}
                                        </div>
                                        <span className="text-[9px] text-jaguar-400 uppercase tracking-tighter">{aff.category}</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${aff.isJaguar ? 'bg-jaguar-500/20' : 'bg-white/10'}`}>
                                        <Sparkles size={10} className={aff.isJaguar ? 'text-jaguar-400' : 'text-white/40'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. BOTÓN DE ACCIÓN (CTA) */}
                <button className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-jaguar-600 to-jaguar-500 p-[1px]">
                    {/* Fondo oscuro interior para efecto borde, o relleno completo para énfasis */}
                    <div className="relative bg-jaguar-900/40 group-hover:bg-transparent transition-colors rounded-xl h-full">
                        <div className="flex items-center justify-center gap-3 py-3 px-4">
                            <div className="bg-white text-jaguar-900 rounded-full p-1">
                                <Play size={12} fill="currentColor" />
                            </div>
                            <span className="font-display font-bold text-white tracking-wide text-sm group-hover:text-jaguar-950 transition-colors">
                                INICIAR TRAVESÍA
                            </span>
                        </div>
                    </div>
                </button>

            </div>
        </div>
    );
};

export default RouteDetailCard;
