import React, { useEffect } from 'react';
import { Camera, X, Crosshair } from 'lucide-react';

/**
 * SentinelCamera
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de cámara para captura de evidencia ambiental.
 * Muestra un HUD con coordenadas GPS, timestamp y heading de brújula.
 * Al capturar, embebe los metadatos en el canvas (invisible para el usuario
 * en la imagen final, pero presentes como overlay técnico en esquina inferior).
 */
const SentinelCamera = ({ videoRef, location, heading, onCapture, onCancel, startCamera }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

    useEffect(() => {
        startCamera();
    }, []);

    const headingLabel = (deg) => {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
        return dirs[Math.round(deg / 45) % 8];
    };

    return (
        <div className="fixed inset-0 z-[95] bg-black flex flex-col">
            {/* Video Stream */}
            <div className="relative flex-1 overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay oscuro en bordes (viñeta) */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)' }} />

                {/* Viewfinder retícula */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-72 h-64">
                        {/* Esquinas del visor */}
                        {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                            'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                                <div key={i} className={`absolute w-6 h-6 border-emerald-400 ${cls}`} />
                            ))}
                        <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400/50" />
                    </div>
                </div>

                {/* HUD Superior — Metadata en tiempo real */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                    <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 border border-emerald-500/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">GPS</p>
                        {location ? (
                            <>
                                <p className="text-[11px] font-mono text-white">{location.lat.toFixed(5)}°</p>
                                <p className="text-[11px] font-mono text-white">{location.lng.toFixed(5)}°</p>
                            </>
                        ) : (
                            <p className="text-[11px] font-mono text-white/40 animate-pulse">Localizando...</p>
                        )}
                    </div>

                    <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 border border-emerald-500/20 text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Brújula</p>
                        <p className="text-[14px] font-black text-white">
                            {heading !== null ? `${heading}° ${headingLabel(heading)}` : '--°'}
                        </p>
                    </div>
                </div>

                {/* HUD Inferior — Timestamp */}
                <div className="absolute bottom-28 left-0 right-0 flex justify-center">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center">
                        <p className="text-[11px] font-mono text-white/70">{dateStr} · {timeStr}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-0.5">
                            Evidencia Técnica — Territorio Jaguar
                        </p>
                    </div>
                </div>

                {/* Botón Cancelar */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Barra de captura */}
            <div className="bg-black/90 backdrop-blur-md px-8 py-6 flex items-center justify-center">
                <button
                    onClick={onCapture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }}
                >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Camera className="w-8 h-8 text-jaguar-950" />
                    </div>
                    {/* Pulso */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                </button>
            </div>
        </div>
    );
};

export default SentinelCamera;
