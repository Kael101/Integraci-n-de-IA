// src/components/map/AncientHistoryOverlay.jsx
import React, { useState } from 'react';
import { Landmark, Headphones, X, Volume2, Pause, Sparkles } from 'lucide-react';

const AncientHistoryOverlay = ({ onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // Simulación de audio
    const toggleAudio = () => {
        setIsPlaying(!isPlaying);
        // Aquí iría la lógica real de reproducción de audio
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-jaguar-950 border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Textura de "Papel Digital Antiguo" (Fondo con ruido) */}
                <div className="absolute inset-0 bg-[#1a1500] opacity-90"></div>
                <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

                {/* Header */}
                <div className="relative p-6 border-b border-amber-500/20">
                    <button onClick={onClose} className="absolute top-4 right-4 text-amber-500/50 hover:text-amber-400">
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-500/20 p-2 rounded-full border border-amber-500/50">
                            <Landmark className="text-amber-400" size={24} />
                        </div>
                        <span className="text-amber-400 text-xs font-black uppercase tracking-[0.2em]">Dossier del Territorio</span>
                    </div>

                    <h2 className="font-display font-bold text-2xl text-white leading-tight">
                        Sendero Ancestral <span className="text-amber-500">Sangay</span>
                    </h2>
                    <p className="text-white/40 text-xs mt-1 font-mono">500 a.C. – 600 d.C. • Sector 1</p>
                </div>

                {/* Contenido Scrollable */}
                <div className="relative p-6 max-h-[60vh] overflow-y-auto space-y-8 script-scroll">

                    {/* Intro Impactante */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-amber-200 text-sm font-medium italic border-l-2 border-amber-500 pl-3">
                            "Estás explorando el urbanismo más antiguo descubierto en la cuenca del Amazonas."
                        </p>
                    </div>

                    {/* Sección 1: Visión LiDAR */}
                    <section>
                        <h3 className="flex items-center gap-2 text-white font-bold mb-2">
                            <Sparkles size={16} className="text-cyan-400" />
                            <span className="text-cyan-400">La Visión LiDAR</span>
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Bajo el dosel de la selva que hoy recorres, existe una red de ciudades jardín conectadas por kilómetros de caminos rectos. No fue hasta 2024 que la tecnología láser LiDAR "desnudó" el terreno, revelando más de <b className="text-white">6.000 montículos artificiales</b>.
                        </p>
                    </section>

                    {/* Sección 2: Ingeniería */}
                    <section>
                        <h3 className="text-white font-bold mb-3">🏗️ Ingeniería del Pasado</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-white/70">
                                <span className="text-amber-500 font-bold shrink-0">01.</span>
                                <span><b className="text-white">Plataformas Elevadas:</b> Para protegerse de la humedad y mostrar estatus.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-white/70">
                                <span className="text-amber-500 font-bold shrink-0">02.</span>
                                <span><b className="text-white">Canales de Drenaje:</b> Ingeniería hidráulica avanzada para gestionar las lluvias.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-white/70">
                                <span className="text-amber-500 font-bold shrink-0">03.</span>
                                <span><b className="text-white">Caminos Reales:</b> Calzadas de hasta 10 metros de ancho, tan rectas que parecen trazadas con láser.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Sección 3: Vida en el Valle */}
                    <section className="bg-white/5 rounded-xl p-4">
                        <h3 className="text-white font-bold mb-2">🌽 La Vida en el Valle</h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Lejos de ser nómadas, esta fue una sociedad densa y agrícola. Cultivaron maíz, yuca y camote, y procesaban cacao. Eran comerciantes que conectaban los Andes con la Amazonía.
                        </p>
                    </section>

                    {/* Curiosidad "Ecos del Jaguar" */}
                    <div className="bg-jaguar-500/10 border border-jaguar-500/30 rounded-xl p-4 flex gap-3">
                        <div className="text-2xl">🐆</div>
                        <div>
                            <h4 className="text-jaguar-400 font-bold text-xs uppercase mb-1">Eco del Jaguar</h4>
                            <p className="text-white/80 text-xs">
                                La ciudad que estás pisando estuvo habitada por más de 1.000 años. ¡Más tiempo que muchas ciudades modernas de Europa!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Flotante de Audio */}
                <div className="relative p-4 bg-gradient-to-t from-black to-transparent border-t border-white/10">
                    <button
                        onClick={toggleAudio}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${isPlaying
                                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isPlaying ? <Pause size={20} /> : <Headphones size={20} />}
                        <span>{isPlaying ? 'Pausar Relato' : 'Escuchar Historia (3 min)'}</span>
                        {isPlaying && <div className="flex gap-1 items-end h-4 ml-2">
                            <span className="w-1 bg-black h-2 animate-bounce"></span>
                            <span className="w-1 bg-black h-4 animate-bounce delay-75"></span>
                            <span className="w-1 bg-black h-3 animate-bounce delay-150"></span>
                        </div>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AncientHistoryOverlay;
