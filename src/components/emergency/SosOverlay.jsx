import { X, ShieldAlert, Phone, ChevronRight, Check, Info } from 'lucide-react';
import useEmergencyBroadcast from '../../hooks/useEmergencyBroadcast';
import { useEmergencyProtocol } from '../../hooks/useEmergencyProtocol';
import FirstAidLibrary from './FirstAidLibrary';
import JIcon from '../ui/JIcon';

/**
 * SosOverlay
 * Full-screen high-contrast emergency interface with slide-to-confirm mechanism.
 */
const SosOverlay = ({ onClose, nearbyProviders = [] }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, activating, active
    const [selectedAction, setSelectedAction] = useState(null);
    const sliderRef = useRef(null);

    const { broadcastEmergency, isBroadcasting, error: broadcastError } = useEmergencyBroadcast();
    const { triggerAntigravityAlert } = useEmergencyProtocol();

    const [showGuide, setShowGuide] = useState(false);
    const [guideData, setGuideData] = useState([]);

    useEffect(() => {
        // Cargar guía de primeros auxilios
        import('../../data/first_aid_guide.json').then(data => setGuideData(data.default));

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

        // Ejecutar Protocolo Antigravity (Rastreo de fondo / Satelital simulado)
        triggerAntigravityAlert();

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
                        <JIcon icon={X} size={32} variant="secondary" />
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
                            <JIcon icon={ShieldAlert} size={120} className="relative z-10 mx-auto animate-bounce" variant="secondary" />
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
                                className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl transition-all duration-75 relative z-20"
                                style={{ transform: `translateX(${sliderValue * 0.01 * (sliderRef.current?.offsetWidth - 64 || 0)}px)` }}
                                ref={sliderRef}
                            >
                                <JIcon icon={ChevronRight} size={32} variant="danger" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                        <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center text-red-600 relative">
                            <div className="absolute inset-0 bg-white rounded-full animate-radar opacity-20"></div>
                            {status === 'activating' ? <div className="w-12 h-12 border-8 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <JIcon icon={Check} size={64} variant="danger" />}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black uppercase italic underline decoration-white/30 decoration-4">
                                {status === 'activating' ? 'Enviando Coordenadas...' : 'Simulación Exitosa'}
                            </h3>
                            <p className="text-sm font-bold text-white/80 max-w-xs mx-auto">
                                {status === 'fallback' ? 'Abriendo canales de emergencia SMS/911.' : 'Coordenadas enviadas a Central de Monitoreo GAD.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista Horizontal de Tarjetas de Acción (Modo Pánico) */}
            <div className="mt-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 ml-2">Auxilio Inmediato</p>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 mask-linear-fade">
                    {guideData.protocols?.map(protocol => (
                        <button
                            key={protocol.id}
                            onClick={() => setSelectedAction(protocol)}
                            className="shrink-0 w-28 h-28 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-90 transition-all shadow-xl"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${protocol.priority === 'CRITICAL' ? 'bg-red-500' :
                                protocol.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}>
                                <JIcon icon={ShieldAlert} size={18} variant="secondary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter leading-tight px-2">
                                {protocol.title.split(' ')[0]}<br />{protocol.title.split(' ').slice(1).join(' ')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal de Acción Rápida (Lectura 5 segundos) */}
            {selectedAction && (
                <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-200">
                    <div className="bg-red-700 w-full max-w-md rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/20 relative">
                        <button
                            onClick={() => setSelectedAction(null)}
                            className="absolute -top-4 -right-4 bg-white text-red-700 p-4 rounded-full shadow-2xl active:scale-90 transition-all border-4 border-red-700"
                        >
                            <JIcon icon={X} size={24} variant="danger" />
                        </button>

                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8 border-b-4 border-white pb-4">
                            {selectedAction.title}
                        </h3>

                        <div className="space-y-6 mb-10">
                            {selectedAction.panic_mode_steps.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <span className="text-4xl font-black text-white/30 shrink-0 leading-none">{i + 1}</span>
                                    <p className="text-2xl font-black leading-tight uppercase tracking-tight text-white italic">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {selectedAction.do_not_do && (
                            <div className="bg-black/30 p-6 rounded-3xl border-2 border-red-500/50">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 text-center">🚫 ESTÁ PROHIBIDO</p>
                                <ul className="space-y-2">
                                    {selectedAction.do_not_do.map((step, i) => (
                                        <li key={i} className="text-sm font-black text-red-300 uppercase leading-none pl-4 border-l-4 border-red-500">
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedAction(null)}
                            className="w-full mt-8 bg-white text-red-700 py-6 rounded-2xl text-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Guía de Primeros Auxilios (Refinado) */}
            {showGuide && (
                <FirstAidLibrary
                    data={guideData}
                    onClose={() => setShowGuide(false)}
                />
            )}

            {/* Guía Rápida (Solo si no está confirmado aún) */}
            {!isConfirmed && (
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button
                        onClick={() => window.location.href = 'tel:911'}
                        className="bg-white text-red-600 p-6 rounded-3xl flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all"
                    >
                        <JIcon icon={Phone} size={24} variant="danger" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Llamada 911</span>
                    </button>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="bg-red-700 text-white p-6 rounded-3xl flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all border border-white/10"
                    >
                        <JIcon icon={Info} size={24} variant="secondary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Guía Primeros Auxilios</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SosOverlay;
