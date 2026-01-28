import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Shield, Gift, ArrowRight } from 'lucide-react';
import JIcon from '../ui/JIcon';

/**
 * Overlay AR para "Murales Vivos".
 * Muestra el contenido 3D simulado y el diálogo del agente.
 */
const MuralOverlay = ({ station, onClose, onUnlock }) => {
    const [step, setStep] = useState('scan'); // scan | active | reward
    const [showSubtitles, setShowSubtitles] = useState(true);

    // Simular detección tras 3 segundos
    useEffect(() => {
        if (step === 'scan') {
            const timer = setTimeout(() => {
                setStep('active');
                onUnlock(station.id); // Desbloquear automáticamente al detectar
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, station.id, onUnlock]);

    // Renderizar contenido AR según el efecto
    const renderAREffect = () => {
        switch (station.arEffect) {
            case 'dance_shuar':
                return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-4 border-jaguar-500 rounded-full animate-spin-slow opacity-50"></div>
                        <div className="text-6xl animate-bounce">💃🏽</div>
                        <div className="absolute top-1/2 mt-16 text-jaguar-400 font-display font-bold text-shadow">Danza Ancestral</div>
                    </div>
                );
            case 'animals_run':
                return (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute bottom-10 left-[-100px] animate-run-right text-6xl">🐆</div>
                        <div className="absolute bottom-20 right-[-100px] animate-run-left text-5xl delay-500">🐗</div>
                    </div>
                );
            case 'water_flow':
                return (
                    <div className="absolute inset-0 pointer-events-none bg-blue-500/10 backdrop-blur-[1px]">
                        <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-gradient-to-b from-blue-400/20 to-transparent"></div>
                        <div className="absolute center text-white font-bold">💧 Pureza: 98%</div>
                    </div>
                );
            case 'justice_scales':
                return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-8xl animate-pulse">⚖️</div>
                    </div>
                );
            case 'golden_path':
                return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-2 bg-jaguar-500 shadow-[0_0_20px_#C5A059] rotate-45 transform"></div>
                        <div className="absolute text-jaguar-400 font-bold text-2xl bg-black/50 px-4 rounded">Macas ── Logroño</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 text-white font-body">

            {/* FONDO DE CÁMARA (SIMULADO) */}
            <div className="absolute inset-0 bg-gray-800 opacity-50">
                {/* Aquí iría el componente <Camera> real */}
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1596395818817-4f0580ea5d19?q=80&w=1000')] bg-cover bg-center mix-blend-overlay"></div>
            </div>

            {/* HEADER INTERFAZ */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-jaguar-400" />
                        <span className="text-[10px] uppercase tracking-widest text-jaguar-400">Murales Vivos</span>
                    </div>
                    <h2 className="font-display font-bold text-xl">{station.name}</h2>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                    <X size={20} />
                </button>
            </div>

            {/* ESCANER UI */}
            {step === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-jaguar-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-jaguar-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-jaguar-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-jaguar-500 -mb-1 -mr-1"></div>
                        <div className="w-full h-0.5 bg-jaguar-500 absolute top-1/2 animate-scan"></div>
                    </div>
                    <p className="mt-4 text-sm font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                        Escaneando mural...
                    </p>
                </div>
            )}

            {/* CONTENIDO ACTIVO */}
            {step === 'active' && (
                <>
                    {renderAREffect()}

                    {/* SUBTÍTULOS / AGENTE */}
                    {showSubtitles && (
                        <div className="absolute bottom-10 left-4 right-4 z-20">
                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl relative">
                                {/* Indicador de quien habla */}
                                <div className="absolute -top-3 left-4 bg-jaguar-600 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                                    <Mic size={10} />
                                    {station.dialogue.speaker}
                                </div>

                                <p className="text-base leading-relaxed text-gray-100 italic">
                                    "{station.dialogue.text}"
                                </p>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex gap-2 text-jaguar-400 text-xs">
                                        <Volume2 size={14} className="animate-pulse" />
                                        <span>Audio Espacial Activo</span>
                                    </div>

                                    {/* Si es la última estación, mostrar recompensa */}
                                    {station.reward ? (
                                        <button
                                            onClick={() => setStep('reward')}
                                            className="bg-jaguar-500 text-black font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2"
                                        >
                                            <Gift size={14} /> Reclamar Recompensa
                                        </button>
                                    ) : (
                                        <button onClick={onClose} className="text-xs text-white/50 hover:text-white flex items-center gap-1">
                                            Continuar ruta <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* RECOMPENSA FINAL */}
            {step === 'reward' && station.reward && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-jaguar-950/90 backdrop-blur-xl p-8 text-center animate-fade-in">
                    <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-jaguar-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(197,160,89,0.5)] animate-bounce">
                        <Shield size={64} className="text-black" />
                    </div>
                    <h2 className="font-display font-bold text-3xl text-white mb-2">¡Sello Oro Desbloqueado!</h2>
                    <p className="text-gray-300 mb-8 max-w-xs mx-auto">
                        Has demostrado ser un Guardián. Muestra este código en el Showroom de Artesanos.
                    </p>

                    <div className="bg-white p-4 rounded-xl mb-8">
                        {/* QR Placeholder */}
                        <div className="w-48 h-48 bg-black flex items-center justify-center text-white font-mono text-xs">
                            [QR CODE: {station.reward.code}]
                        </div>
                    </div>

                    <button onClick={onClose} className="w-full bg-jaguar-500 py-4 rounded-xl text-black font-bold">
                        Guardar en Billetera
                    </button>
                </div>
            )}
        </div>
    );
};

export default MuralOverlay;
