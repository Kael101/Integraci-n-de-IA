import React, { useState } from 'react';
import { X, Camera, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { PASSPORT_POIS } from '../../data/passport_data';

const QRScannerModal = ({ onClose, onScan, isProcessing, error }) => {
    // Simulación de cámara para PWA sin librería externa pesada por ahora
    // En producción: Integrar 'html5-qrcode' aquí.

    const [mockScanning, setMockScanning] = useState(true);

    const handleMockScan = () => {
        // SIMULACIÓN: Escanear el primer POI cercano "Teatro" para demo
        // En real: onScan(decodedText)
        setMockScanning(false);
        onScan("hash_teatro_2024_secure");
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black font-body">

            {/* VISTA DE CÁMARA (SIMULADA) */}
            <div className="absolute inset-0 bg-gray-900">
                {/* Imagen estática de "cámara" como placeholder */}
                <div className="w-full h-full opacity-30 bg-[url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center"></div>

                {/* Overlay de Escaneo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-jaguar-400/50 rounded-3xl relative animate-pulse">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-jaguar-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-jaguar-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-jaguar-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-jaguar-500 -mb-1 -mr-1"></div>

                        {/* Línea de escaneo */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-jaguar-400/80 shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-slide-down-scan"></div>
                    </div>
                </div>

                <div className="absolute bottom-32 left-0 right-0 text-center text-white/80 text-sm font-bold tracking-widest uppercase">
                    Apunta al Código QR del Sello
                </div>
            </div>

            {/* UI SUPERIOR */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <Camera size={16} className="text-jaguar-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Escáner de Pasaporte</span>
                </div>
                <button onClick={onClose} className="p-2 bg-black/60 rounded-full text-white hover:bg-white/20">
                    <X size={24} />
                </button>
            </div>

            {/* MENSAJES DE ERROR / ÉXITO */}
            {error && (
                <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 bg-red-500/90 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center animate-bounce-short z-20">
                    <AlertTriangle size={48} className="mx-auto text-white mb-2" />
                    <h3 className="text-xl font-black text-white uppercase italic">Error de Validación</h3>
                    <p className="text-white font-medium mt-2">{error}</p>
                    <button onClick={onClose} className="mt-4 bg-white text-red-600 font-bold py-2 px-6 rounded-xl uppercase text-xs tracking-widest">
                        Entendido
                    </button>
                </div>
            )}

            {/* CONTROLES (SOLO DEMO) */}
            <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-center z-10">
                <button
                    onClick={handleMockScan}
                    disabled={isProcessing}
                    className="bg-white text-black font-bold py-4 px-8 rounded-full shadow-xl active:scale-95 transition-transform flex items-center gap-3 disabled:opacity-50"
                >
                    {isProcessing ? (
                        <>Procesando...</>
                    ) : (
                        <>
                            <Camera size={20} />
                            <span>Simular Escaneo (Demo)</span>
                        </>
                    )}
                </button>
            </div>

            <style jsx>{`
                @keyframes slide-down-scan {
                    0% { top: 10%; opacity: 0; }
                    20% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
                .animate-slide-down-scan {
                    animation: slide-down-scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default QRScannerModal;
