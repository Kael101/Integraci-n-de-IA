import React, { useState } from 'react';
import { Trophy, Lock, MapPin, ScanLine, X, Award, ChevronLeft } from 'lucide-react';
import JIcon from '../ui/JIcon';
import { useGamification } from '../../hooks/useGamification';
import usePassportScanner from '../../hooks/usePassportScanner';
import { PASSPORT_POIS } from '../../data/passport_data';
import QRScannerModal from './QRScannerModal';

const PassportView = ({ onClose }) => {
    const {
        currentXP,
        level,
        unlockedStamps,
        xpToNext,
        progressPercent,
        unlockStamp,
        justLeveledUp,
        resetLevelUpFlag
    } = useGamification();

    const { validateScan, userLocation } = usePassportScanner();

    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [lastUnlocked, setLastUnlocked] = useState(null);

    const handleScan = (scannedContent) => {
        // Ejecutar lógica de validación
        const resultPOI = validateScan(scannedContent);

        if (resultPOI) {
            // Intento desbloquear en el sistema de gamificación
            const unlockResult = unlockStamp(resultPOI.id, resultPOI.xp_value, resultPOI.route_id);

            if (unlockResult) {
                // Nuevo sello desbloqueado!
                setShowScanner(false);
                setLastUnlocked({ ...resultPOI, xpGained: unlockResult.xpGained });
                // Aquí podríamos reproducir un sonido de éxito
            } else {
                setScanError("¡Ya tienes este sello en tu colección!");
            }
        } else {
            // El hook usePassportScanner ya maneja el estado interno de error, 
            // pero si necesitamos mostrarlo en el modal, lo pasamos.
            // Para simplicidad en este demo, seteamos un error genérico si validateScan retorna false
            // y no fue por error de GPS (que ya lo maneja el hook internamente si expusiéramos su error).
            setScanError("Error de validación. Acércate más o revisa el código.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-jaguar-950 font-body overflow-y-auto animate-fade-in">

            {/* 1. HEADER & NIVEL */}
            <div className="relative bg-jaguar-900 pb-8 rounded-b-[3rem] shadow-2xl shadow-jaguar-900/50 border-b border-white/5">
                <div className="absolute top-0 inset-x-0 h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

                {/* Navbar */}
                <div className="relative flex justify-between items-center p-6">
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronLeft className="text-white" size={24} />
                    </button>
                    <h1 className="font-display font-bold text-lg text-white tracking-widest uppercase">
                        Pasaporte Digital
                    </h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                {/* Level Circle */}
                <div className="flex flex-col items-center justify-center mt-2 relative z-10">
                    <div className="relative">
                        {/* Glow Animation si subió de nivel */}
                        {justLeveledUp && <div className="absolute inset-0 bg-jaguar-400 rounded-full blur-xl animate-pulse"></div>}

                        <div className="w-28 h-28 bg-gradient-to-tr from-jaguar-600 to-jaguar-800 rounded-full flex items-center justify-center border-4 border-jaguar-950 shadow-xl relative overflow-hidden">
                            <Trophy size={48} className="text-jaguar-200" />
                            {/* Progress Ring SVG could go here */}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-jaguar-950 font-black px-4 py-1 rounded-full text-sm shadow-lg whitespace-nowrap border-2 border-jaguar-950">
                            NIVEL {level}
                        </div>
                    </div>

                    <div className="mt-6 w-64">
                        <div className="flex justify-between text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2">
                            <span>XP {currentXP}</span>
                            <span>Siguiente: {currentXP + xpToNext}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-jaguar-500 to-jaguar-400 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. GRID DE SELLOS */}
            <div className="p-6 pb-24">
                <div className="flex items-center gap-2 mb-6 opacity-60">
                    <Award size={16} className="text-jaguar-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                        Colección de Sellos ({unlockedStamps.length}/{PASSPORT_POIS.length})
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {PASSPORT_POIS.map((poi) => {
                        const isUnlocked = unlockedStamps.includes(poi.id);

                        return (
                            <div
                                key={poi.id}
                                className={`relative aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-300 ${isUnlocked
                                        ? 'border-jaguar-500/50 shadow-lg shadow-jaguar-500/10'
                                        : 'border-white/5 bg-white/5 grayscale opacity-70'
                                    }`}
                            >
                                {/* Imagen de Fondo */}
                                <img src={poi.image} alt={poi.name} className="absolute inset-0 w-full h-full object-cover" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                                {/* Contenido */}
                                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                    {!isUnlocked ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                            <Lock size={32} className="text-white/50" />
                                        </div>
                                    ) : (
                                        <div className="absolute top-2 right-2 bg-jaguar-500 text-jaguar-950 p-1 rounded-full shadow-lg animate-bounce-short">
                                            <Award size={12} />
                                        </div>
                                    )}

                                    <h3 className="font-display font-bold text-white text-sm leading-tight mb-1 relative z-10">
                                        {poi.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-[10px] text-white/60 font-mono relative z-10">
                                        <MapPin size={10} />
                                        <span>{isUnlocked ? "VISITADO" : "BLOQUEADO"}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. FAB SCANNER */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none">
                <button
                    onClick={() => setShowScanner(true)}
                    className="pointer-events-auto bg-white text-jaguar-950 font-black py-4 px-8 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform border-4 border-jaguar-950"
                >
                    <ScanLine size={24} />
                    <span className="text-sm tracking-widest uppercase">Escanear Sello</span>
                </button>
            </div>

            {/* MODALES */}

            {/* Scanner */}
            {showScanner && (
                <QRScannerModal
                    onClose={() => { setShowScanner(false); setScanError(null); }}
                    onScan={handleScan}
                    isProcessing={false}
                    error={scanError}
                />
            )}

            {/* Level Up / Unlock Celebration Overlay */}
            {(justLeveledUp || lastUnlocked) && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
                    <div className="text-center">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-jaguar-400 blur-[60px] animate-pulse"></div>
                            <Trophy size={80} className="text-jaguar-400 relative z-10 mx-auto animate-bounce" />
                        </div>

                        <h2 className="font-display font-black text-4xl text-white italic tracking-tighter mb-2">
                            {justLeveledUp ? "¡NIVEL SUBIDO!" : "¡SELLO DESBLOQUEADO!"}
                        </h2>
                        <p className="text-white/60 font-bold uppercase tracking-widest mb-8">
                            {justLeveledUp ? `Ahora eres Nivel ${level}` : `Has ganado +${lastUnlocked?.xpGained} XP`}
                        </p>

                        <button
                            onClick={() => { resetLevelUpFlag(); setLastUnlocked(null); }}
                            className="bg-jaguar-500 text-jaguar-950 font-bold py-3 px-8 rounded-xl shadow-xl hover:bg-white transition-colors uppercase tracking-widest"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PassportView;
