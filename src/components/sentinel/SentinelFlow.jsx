import React from 'react';
import { CheckCircle, Star, Leaf } from 'lucide-react';
import { useSentinelReport } from '../../hooks/useSentinelReport';
import { useGamification } from '../../hooks/useGamification';
import SentinelCamera from './SentinelCamera';
import SentinelCategoryPicker from './SentinelCategoryPicker';
import SentinelConfirmation from './SentinelConfirmation';
import SentinelPanicOverlay from './SentinelPanicOverlay';

/**
 * SentinelFlow
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente maestro que orquesta todo el flujo "Centinela del Jaguar".
 * Integra el hook useSentinelReport con la gamificación.
 * Renderiza condicionalmente cada paso del flujo.
 *
 * Props:
 *   onClose — callback para cerrar el módulo desde el mapa
 */
const XP_REWARD = 500;
const STAMP_ID = 'CORAZON_DE_SELVA';

const SuccessScreen = ({ onClose }) => (
    <div className="fixed inset-0 z-[95] bg-jaguar-950 flex flex-col items-center justify-center p-8 text-center">
        {/* Animación de éxito */}
        <div className="relative mb-8">
            <div className="w-32 h-32 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                <CheckCircle className="w-16 h-16 text-emerald-400" />
            </div>
            {/* Partículas */}
            {['top-0 left-8', 'top-4 right-4', 'bottom-4 left-2', 'bottom-0 right-8', '-top-2 left-1/2'].map((pos, i) => (
                <div
                    key={i}
                    className={`absolute ${pos} text-2xl animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }}
                >
                    🌿
                </div>
            ))}
        </div>

        {/* Mensaje principal */}
        <h2 className="text-3xl font-black uppercase italic text-white mb-3 leading-tight">
            ¡Reporte<br />Enviado!
        </h2>
        <p className="text-[13px] text-white/60 max-w-xs leading-relaxed mb-8">
            Tu reporte ha sido enviado a la coalición de protección amazónica.{' '}
            <strong className="text-emerald-400">Gracias por proteger el Territorio Jaguar.</strong>
        </p>

        {/* Badge de XP */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-2xl px-6 py-4 flex items-center gap-4 mb-6 animate-in slide-in-from-bottom duration-500 delay-300">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-0.5">
                    Puntos de Guardián
                </p>
                <p className="text-2xl font-black text-white">+{XP_REWARD} XP</p>
            </div>
        </div>

        {/* Medalla */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 flex items-center gap-3 mb-10 animate-in slide-in-from-bottom duration-500 delay-500">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Medalla desbloqueada</p>
                <p className="text-[13px] font-black text-white">Corazón de Selva 🌿</p>
            </div>
        </div>

        <button
            onClick={onClose}
            className="w-full max-w-xs py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
            Volver al Mapa
        </button>
    </div>
);

const SentinelFlow = ({ onClose }) => {
    const {
        step, capturedImage, location, heading, category,
        isSaving, error, videoRef, isPanicActive,
        acceptLegal, startCamera, stopCamera, captureFrame,
        selectCategory, submitReport, resetFlow, activatePanic
    } = useSentinelReport();

    const { addXP, unlockStamp } = useGamification();

    const handleSubmit = async () => {
        await submitReport();
        // Recompensar al usuario
        addXP(XP_REWARD);
        unlockStamp(STAMP_ID, XP_REWARD);
    };

    const handleClose = () => {
        stopCamera();
        resetFlow();
        onClose?.();
    };

    // Paso: legal — el SentinelEntryButton ya lo maneja; aquí empezamos en camera
    if (isPanicActive || step === 'hidden') {
        return <SentinelPanicOverlay onPanic={activatePanic} isPanicActive={true}><></></SentinelPanicOverlay>;
    }

    return (
        <SentinelPanicOverlay onPanic={activatePanic} isPanicActive={false}>
            {step === 'camera' && (
                <SentinelCamera
                    videoRef={videoRef}
                    location={location}
                    heading={heading}
                    startCamera={startCamera}
                    onCapture={captureFrame}
                    onCancel={handleClose}
                />
            )}

            {step === 'category' && (
                <SentinelCategoryPicker
                    onSelect={selectCategory}
                    onBack={() => startCamera()}
                />
            )}

            {step === 'confirm' && (
                <SentinelConfirmation
                    capturedImage={capturedImage}
                    category={category}
                    location={location}
                    isSaving={isSaving}
                    onSubmit={handleSubmit}
                    onBack={() => selectCategory(null)}
                />
            )}

            {step === 'success' && <SuccessScreen onClose={handleClose} />}

            {/* Error toast */}
            {error && (
                <div className="fixed bottom-6 left-4 right-4 z-[100] bg-red-900/90 backdrop-blur-md border border-red-500/30 rounded-2xl px-5 py-4 text-[12px] font-bold text-white text-center animate-in slide-in-from-bottom">
                    ⚠️ {error}
                </div>
            )}
        </SentinelPanicOverlay>
    );
};

// Trigger externo: inicia la cámara directamente
export const startSentinelFlow = (setFlowActive) => setFlowActive(true);

export default SentinelFlow;
