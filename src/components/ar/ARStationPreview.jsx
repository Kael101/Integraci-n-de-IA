import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, PawPrint, Info, Share2, Activity, MapPin, Zap } from 'lucide-react';

const ARStationPreview = () => {
    const [scanning, setScanning] = useState(true);
    const [detected, setDetected] = useState(false);
    const [showData, setShowData] = useState(false);

    // Simulación de escaneo y detección
    useEffect(() => {
        if (scanning) {
            const timer = setTimeout(() => {
                setScanning(false);
                setDetected(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [scanning]);

    return (
        <div className="relative h-screen w-full bg-slate-900 overflow-hidden font-sans">
            {/* 1. VISTA DE CÁMARA (SIMULADA) */}
            <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=1000")' }}>
                {/* Capa de selva con desenfoque de movimiento */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* 2. OVERLAY DE ESCANEO */}
            {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-64 h-64 border-2 border-dashed border-green-400 rounded-3xl animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-[bounce_2s_infinite]"></div>
                    </div>
                    <p className="mt-8 text-white font-bold tracking-widest animate-pulse">BUSCANDO MARCADOR IWI...</p>
                </div>
            )}

            {/* 3. MODELO 3D FANTASMA (SIMULADO CON SVG) */}
            {detected && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative group transition-all duration-1000 transform scale-110">
                        {/* El "Jaguar Fantasma" */}
                        <div className="opacity-60 animate-pulse text-green-300 drop-shadow-[0_0_25px_rgba(74,222,128,0.6)]">
                            <svg width="300" height="200" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.2 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8.4 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6.3 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4.2 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                        </div>

                        {/* Etiquetas flotantes AR */}
                        <div className="absolute -top-16 -right-16 bg-black/80 backdrop-blur-md border border-green-500/30 p-3 rounded-2xl text-white min-w-[150px] animate-bounce">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={14} className="text-green-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Detección Real IA</span>
                            </div>
                            <p className="text-sm font-bold">Macho Adulto</p>
                            <p className="text-[10px] opacity-70">Hace 45 min en este punto</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. CONTROLES DE INTERFAZ (UI OVERLAY) */}
            <div className="absolute top-10 left-6 right-6 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                        <MapPin size={12} className="text-red-400" />
                        <span className="text-[10px] text-white font-bold uppercase">Sector Abanico</span>
                    </div>
                    <h2 className="text-white text-lg font-bold">Estación Fantasma #01</h2>
                </div>
                <button onClick={() => setScanning(true)} className="bg-white/20 backdrop-blur-lg p-3 rounded-full border border-white/30 text-white">
                    <Zap size={20} />
                </button>
            </div>

            <div className="absolute bottom-12 left-6 right-6">
                {detected && (
                    <div className="space-y-4">
                        {/* Card de información expandible */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">Sinergia IA Upano</h3>
                                    <p className="text-sm opacity-80">El modelo 3D que ves se basa en la huella térmica captada hace poco.</p>
                                </div>
                                <div className="bg-green-500 p-2 rounded-xl">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-green-600 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                                    <Share2 size={16} /> Compartir Hallazgo
                                </button>
                                <button className="w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Info size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Barra de estado inferior */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="w-32 h-1 bg-white/30 rounded-full"></div>
            </div>
        </div>
    );
};

export default ARStationPreview;
