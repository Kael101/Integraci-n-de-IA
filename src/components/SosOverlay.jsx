import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Phone, Send, Info, ChevronRight, Check, Search } from 'lucide-react';
import useEmergencyBroadcast from '../hooks/useEmergencyBroadcast';

/**
 * SosOverlay
 * Full-screen high-contrast emergency interface with slide-to-confirm mechanism.
 */
const SosOverlay = ({ onClose, nearbyProviders = [] }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, activating, active
    const sliderRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { broadcastEmergency, isBroadcasting, error: broadcastError } = useEmergencyBroadcast();

    const [showGuide, setShowGuide] = useState(false);
    const [guideData, setGuideData] = useState([]);

    useEffect(() => {
        // Cargar guía de primeros auxilios
        import('../data/first_aid_guide.json').then(data => setGuideData(data.default));

        // Verificar si ya estábamos en emergencia
        if (localStorage.getItem('JAGUAR_IS_IN_EMERGENCY') === 'true' && status === 'idle') {
            handleActivation();
        }
    }, [status]);

    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value);
        setSliderValue(val);
        if (val > 90) {
            handleActivation();
            setSliderValue(100);
        }
    };

    const handleActivation = async () => {
        setIsConfirmed(true);
        setStatus('activating');
        localStorage.setItem('JAGUAR_IS_IN_EMERGENCY', 'true');

        // Ejecutar el Grito Digital (GPS + SMS Fallback + Comonidad)
        await broadcastEmergency('Usuario Territorio Jaguar', nearbyProviders);
        setStatus('active');
    };

    const deactivateEmergency = () => {
        localStorage.removeItem('JAGUAR_IS_IN_EMERGENCY');
        setIsConfirmed(false);
        setStatus('idle');
        setSliderValue(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-red-600 text-white flex flex-col p-8 animate-in fade-in duration-300">
            {/* Cabecera */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none italic">
                        SOS<br />JAGUAR
                    </h1>
                </div>
                {!isConfirmed ? (
                    <button onClick={onClose} className="bg-white/10 p-4 rounded-full active:scale-95 transition-all">
                        <X size={32} />
                    </button>
                ) : (
                    <button onClick={deactivateEmergency} className="bg-black/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                        Cancelar SOS (PIN)
                    </button>
                )}
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
                {!isConfirmed ? (
                    <div className="space-y-12 w-full max-w-sm">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 blur-[80px] rounded-full"></div>
                            <ShieldAlert size={120} className="relative z-10 mx-auto animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight">
                            ¿Necesitas ayuda inmediata?
                        </h2>

                        {/* Slider de Confirmación */}
                        <div className="relative h-20 bg-black/20 rounded-[2.5rem] p-2 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderValue}
                                onChange={handleSliderChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full text-center text-xs font-black uppercase tracking-[0.2em] text-white/50">
                                Desliza para pedir ayuda
                            </div>
                            <div
                                className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl transition-all duration-75"
                                style={{ transform: `translateX(${sliderValue * 0.01 * (sliderRef.current?.offsetWidth - 64 || 0)}px)` }}
                                ref={sliderRef}
                            >
                                <ChevronRight size={32} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                        <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center text-red-600 relative">
                            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                            {status === 'activating' ? <div className="w-12 h-12 border-8 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Check size={64} />}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black uppercase italic underline decoration-white/30 decoration-4">
                                {status === 'activating' ? 'Capturando SOS...' : 'Grito Digital Enviado'}
                            </h3>
                            <p className="text-sm font-bold text-white/80 max-w-xs mx-auto">
                                {status === 'fallback' ? 'Abriendo canales de emergencia SMS/911. Por favor envía el mensaje pre-escrito.' : 'Tu posición y estado han sido notificados a los Guardianes de la comunidad.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Guía de Primeros Auxilios (Refinado) */}
            {showGuide && (
                <div className="fixed inset-0 bg-slate-900 z-[110] flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
                    <div className="p-8 bg-slate-900">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">Guía de Auxilio</h2>
                            <button onClick={() => setShowGuide(false)} className="bg-white/10 p-3 rounded-full text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Buscador Rápido */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Buscar emergencia (ej: serpiente)..."
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 pl-12 text-white placeholder:text-white/40 focus:border-red-500 outline-none transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6">
                        {/* Filtrado de Guía */}
                        {guideData
                            .filter(item =>
                                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.steps.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .sort((a, b) => (a.category === 'JUNGLE_TOP3' ? -1 : 1))
                            .map(item => (
                                <div key={item.id} className="bg-white rounded-[2rem] p-8 shadow-2xl border-l-[12px] border-red-600">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {item.category === 'JUNGLE_TOP3' && (
                                                    <span className="bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                        Selva Crítico
                                                    </span>
                                                )}
                                                <span className="bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                    {item.severity}
                                                </span>
                                            </div>
                                            <h4 className="text-2xl font-black uppercase tracking-tight text-black italic">
                                                {item.title}
                                            </h4>
                                        </div>
                                        <div className="bg-slate-100 p-3 rounded-2xl text-slate-400">
                                            <Info size={24} />
                                        </div>
                                    </div>

                                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Síntomas</p>
                                        <p className="text-sm font-bold text-slate-700">{item.symptoms}</p>
                                    </div>

                                    <ul className="space-y-4">
                                        {item.steps.map((step, i) => (
                                            <li key={i} className="flex gap-4 items-start">
                                                <span className="w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                                                    {i + 1}
                                                </span>
                                                <p className="text-base font-bold text-slate-800 leading-tight">
                                                    {step}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Guía Rápida (Solo si no está confirmado aún) */}
            {!isConfirmed && (
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button
                        onClick={() => window.location.href = 'tel:911'}
                        className="bg-white text-red-600 p-6 rounded-3xl flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all"
                    >
                        <Phone size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Llamada 911</span>
                    </button>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="bg-red-700 text-white p-6 rounded-3xl flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all border border-white/10"
                    >
                        <Info size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Guía Primeros Auxilios</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SosOverlay;
