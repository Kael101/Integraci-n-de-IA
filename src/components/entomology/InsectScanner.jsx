import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Zap, CheckCircle, Bug } from 'lucide-react';
import JIcon from '../ui/JIcon';

// Base de datos simulada de insectos locales
const INSECT_DB = [
    { name: 'Morpho Helena', confidence: 0.98, type: 'Mariposa', rarity: 'Rara', description: 'Conocida por su brillante color azul metálico.' },
    { name: 'Escarabajo Hércules', confidence: 0.95, type: 'Coleóptero', rarity: 'Legendaria', description: 'Uno de los escarabajos más grandes de la selva.' },
    { name: 'Hormiga Bala', confidence: 0.92, type: 'Hymenoptera', rarity: 'Común', description: 'Posee una de las picaduras más dolorosas.' },
    { name: 'Mantis Orquídea', confidence: 0.89, type: 'Mantodea', rarity: 'Épica', description: 'Se camufla perfectamente entre las flores.' }
];

const InsectScanner = ({ onClose, onCapture }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Iniciar Cámara
    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("No se pudo acceder a la cámara. Verifica los permisos.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        setAnalyzing(true);

        // Simular análisis de IA (2 segundos)
        setTimeout(() => {
            const randomInsect = INSECT_DB[Math.floor(Math.random() * INSECT_DB.length)];

            // Simular captura de imagen (en un caso real sería canvas.toDataURL)
            const simulatedImage = "https://images.unsplash.com/photo-1534068590799-09895a701e3e?q=80&w=1000&auto=format&fit=crop";

            setResult({ ...randomInsect, image: simulatedImage, timestamp: Date.now() });
            setAnalyzing(false);
        }, 2000);
    };

    const handleSave = () => {
        if (onCapture && result) {
            onCapture(result);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-white font-body">

            {/* VISTA DE CÁMARA */}
            {stream && !result && (
                <div className="absolute inset-0">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {/* Retícula de Enfoque */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                            <div className="absolute top-[-2px] left-[-2px] w-8 h-8 border-t-4 border-l-4 border-jaguar-400"></div>
                            <div className="absolute top-[-2px] right-[-2px] w-8 h-8 border-t-4 border-r-4 border-jaguar-400"></div>
                            <div className="absolute bottom-[-2px] left-[-2px] w-8 h-8 border-b-4 border-l-4 border-jaguar-400"></div>
                            <div className="absolute bottom-[-2px] right-[-2px] w-8 h-8 border-b-4 border-r-4 border-jaguar-400"></div>
                            {analyzing && <div className="absolute inset-0 bg-jaguar-400/20 animate-pulse"></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR STAT (Si no hay cámara) */}
            {error && !result && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <Bug size={48} className="text-gray-500 mb-4" />
                    <p>{error}</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-800 rounded">Cerrar</button>
                </div>
            )}

            {/* UI SUPERIOR */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                        <Bug size={12} className="text-jaguar-400" /> Entomología AI
                    </span>
                </div>
                <button onClick={onClose} className="p-2 bg-black/40 rounded-full backdrop-blur-md">
                    <X size={20} />
                </button>
            </div>

            {/* BOTÓN DE CAPTURA */}
            {!result && !analyzing && !error && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
                    <button
                        onClick={handleCapture}
                        className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
                    </button>
                </div>
            )}

            {/* ESTADO ANALIZANDO */}
            {analyzing && (
                <div className="absolute bottom-20 left-0 right-0 text-center z-10">
                    <div className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                        <span className="text-jaguar-400 font-bold animate-pulse">Analizando especie...</span>
                    </div>
                </div>
            )}

            {/* RESULTADO (TARJETA) */}
            {result && (
                <div className="absolute inset-x-0 bottom-0 bg-jaguar-950 rounded-t-3xl p-6 z-20 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10">
                    <div className="flex flex-col items-center -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-jaguar-500 shadow-xl overflow-hidden bg-gray-800">
                            {/* En producción usaríamos la foto real capturada */}
                            <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-jaguar-500 text-jaguar-950 text-xs font-black px-3 py-1 rounded-full -mt-3 shadow-md uppercase tracking-wider">
                            {Math.round(result.confidence * 100)}% Coincidencia
                        </div>
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-display font-bold text-white mb-1">{result.name}</h2>
                        <span className="text-jaguar-400 text-sm font-bold uppercase tracking-widest">{result.type} • {result.rarity}</span>
                        <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                            {result.description}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setResult(null)} className="flex-1 py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-white">
                            Descartar
                        </button>
                        <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold bg-jaguar-500 text-jaguar-950 flex items-center justify-center gap-2 shadow-lg shadow-jaguar-500/20">
                            <CheckCircle size={18} />
                            Registrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsectScanner;
