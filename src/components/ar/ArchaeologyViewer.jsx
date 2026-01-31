import React, { useState, useEffect, useRef } from 'react';
import { X, ScanLine, Layers, Info } from 'lucide-react';
import lidarCityImg from '../../assets/ar/lidar_city.png';
import jungleBgImg from '../../assets/ar/jungle_bg.png';

const ArchaeologyViewer = ({ onClose }) => {
    const [scanProgress, setScanProgress] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

    // Auto-scan effect simulation
    useEffect(() => {
        let interval;
        if (isScanning) {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        setIsScanning(false);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const toggleScan = () => {
        if (scanProgress === 100) {
            setScanProgress(0);
            setIsScanning(true);
        } else {
            setIsScanning(!isScanning);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black font-body overflow-hidden">
            {/* --- LAYERS --- */}

            {/* Layer 1: Vegetation (Base) */}
            <div className="absolute inset-0">
                <img
                    src={jungleBgImg}
                    alt="Selva Actual"
                    className="w-full h-full object-cover opacity-80"
                />
                {/* Camera Feed Simulation Overlay */}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Layer 2: Lost City (LiDAR) - Revealed by Clip Path */}
            <div
                className="absolute inset-0 z-10"
                style={{
                    clipPath: `inset(0 0 ${100 - scanProgress}% 0)`,
                    transition: isScanning ? 'none' : 'clip-path 0.5s ease-out'
                }}
            >
                <img
                    src={lidarCityImg}
                    alt="Ciudad Perdida LiDAR"
                    className="w-full h-full object-cover filter brightness-125 contrast-125"
                />
                <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay"></div>
            </div>

            {/* Scan Line Indicator */}
            <div
                className="absolute left-0 right-0 h-1 bg-green-400 z-20 shadow-[0_0_20px_#4ade80]"
                style={{
                    top: `${scanProgress}%`,
                    display: scanProgress > 0 && scanProgress < 100 ? 'block' : 'none'
                }}
            >
                <div className="absolute right-0 -top-2 text-[10px] font-mono text-green-400 bg-black/50 px-1">
                    LiDAR: {Math.round(scanProgress)}%
                </div>
            </div>

            {/* --- UI INTERFACE --- */}

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Layers size={14} className="text-orange-400" />
                        <span className="text-[10px] uppercase tracking-widest text-orange-400">Arqueología Digital</span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-white drop-shadow-md">Valle del Upano</h2>
                </div>
                <button onClick={onClose} className="p-2 bg-black/30 rounded-full backdrop-blur-md text-white border border-white/10">
                    <X size={20} />
                </button>
            </div>

            {/* Info Box */}
            {showInfo && (
                <div className="absolute top-24 left-4 right-4 bg-black/60 backdrop-blur-xl border border-orange-500/30 p-4 rounded-xl z-30 animate-fade-in">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-orange-400 font-bold text-sm flex items-center gap-2">
                            <Info size={14} /> Ciudad Oculta
                        </h3>
                        <button onClick={() => setShowInfo(false)} className="text-white/50 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed">
                        Hace 2000 años, esta selva albergaba una civilización avanzada.
                        La tecnología <strong>LiDAR</strong> ("despojo digital") permite ver las estructuras geométricas ocultas bajo la vegetación densa.
                    </p>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 left-0 right-0 px-6 z-30 flex flex-col items-center gap-4">

                {/* Manual Slider */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={scanProgress}
                    onChange={(e) => {
                        setScanProgress(Number(e.target.value));
                        setIsScanning(false);
                    }}
                    className="w-full max-w-xs h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />

                <div className="flex gap-4">
                    <button
                        onClick={toggleScan}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all
                            ${isScanning
                                ? 'bg-red-500/80 text-white animate-pulse'
                                : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                            }
                        `}
                    >
                        <ScanLine size={18} />
                        {isScanning ? 'Escaneando...' : scanProgress === 100 ? 'Reiniciar Escaneo' : 'Iniciar Escaneo LiDAR'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchaeologyViewer;
