import React, { useState } from 'react';
import { HardDrive, Download, Check, Trash2, Cloud, AlertCircle, ArrowLeft } from 'lucide-react';
import JIcon from '../ui/JIcon';

const OfflineManager = ({ onClose }) => {
    // DATOS SIMULADOS DE REGIONES
    const [regions, setRegions] = useState([
        { id: 1, name: 'Macas Urbano & Alrededores', size: '45 MB', status: 'downloaded', image: 'https://images.unsplash.com/photo-1565118531796-763e5082d113?q=80&w=200&auto=format&fit=crop' },
        { id: 2, name: 'Valle del Río Upano', size: '128 MB', status: 'idle', image: 'https://images.unsplash.com/photo-1596395818820-2c70da0e0f3f?q=80&w=200&auto=format&fit=crop' },
        { id: 3, name: 'Reserva Ecológica Kutukú', size: '350 MB', status: 'idle', image: 'https://images.unsplash.com/photo-1544979590-27928d330d07?q=80&w=200&auto=format&fit=crop' },
    ]);

    // Estado del almacenamiento del teléfono (Simulado)
    const storageStats = { used: 65, total: 128 }; // GB

    // Lógica simulada de descarga
    const toggleDownload = (id) => {
        const regionToUpdate = regions.find(r => r.id === id);
        if (!regionToUpdate) return;

        if (regionToUpdate.status === 'downloading') return;

        setRegions(currentRegions =>
            currentRegions.map(region => {
                if (region.id === id) {
                    // Si ya está descargado, lo borramos (vuelve a idle)
                    if (region.status === 'downloaded') return { ...region, status: 'idle' };
                    // Si está idle, empezamos descarga (simulamos loading)
                    if (region.status === 'idle') return { ...region, status: 'downloading', progress: 0 };
                }
                return region;
            })
        );

        // Simular progreso de descarga
        if (regionToUpdate.status === 'idle') {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setRegions(currentRegions =>
                    currentRegions.map(r => r.id === id ? { ...r, progress } : r)
                );
                if (progress >= 100) {
                    clearInterval(interval);
                    setRegions(currentRegions =>
                        currentRegions.map(r => r.id === id ? { ...r, status: 'downloaded' } : r)
                    );
                }
            }, 200); // Velocidad de descarga simulada
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-jaguar-950 flex flex-col animate-fade-in overflow-hidden">

            {/* 1. HEADER TÁCTICO */}
            <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-jaguar-900 to-jaguar-950 border-b border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors active:scale-95">
                        <ArrowLeft className="text-white" size={24} />
                    </button>
                    <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wider">
                        Gestión de Territorio
                    </h1>
                </div>

                {/* Barra de Almacenamiento */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2 text-jaguar-400">
                            <HardDrive size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Almacenamiento Local</span>
                        </div>
                        <span className="text-xs text-white/40">{storageStats.used}GB / {storageStats.total}GB</span>
                    </div>
                    {/* Visualización de la Barra */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-jaguar-500 w-[50%] rounded-full shadow-[0_0_10px_#C5A059]"></div>
                    </div>
                </div>
            </div>

            {/* 2. LISTA DE ZONAS (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">

                {regions.map((region) => (
                    <div
                        key={region.id}
                        className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${region.status === 'downloaded'
                                ? 'bg-jaguar-900/40 border-jaguar-500/30'
                                : 'bg-white/5 border-white/5'
                            }`}
                    >
                        {/* Fondo de imagen oscurecido */}
                        <div className="absolute inset-0">
                            <img src={region.image} alt="" className="w-full h-full object-cover opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-r from-jaguar-950 via-jaguar-950/80 to-transparent" />
                        </div>

                        <div className="relative p-5 flex items-center justify-between">

                            {/* Info de la Zona */}
                            <div>
                                <h3 className={`font-display font-bold text-lg ${region.status === 'downloaded' ? 'text-white' : 'text-gray-300'}`}>
                                    {region.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-white/40 border border-white/10 px-1.5 py-0.5 rounded">
                                        {region.size}
                                    </span>
                                    {region.status === 'downloaded' && (
                                        <span className="text-[10px] font-bold text-jaguar-400 uppercase tracking-wider flex items-center gap-1">
                                            <Check size={10} /> Sincronizado
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* BOTÓN DE ACCIÓN (El corazón de la lógica) */}
                            <button
                                onClick={() => toggleDownload(region.id)}
                                disabled={region.status === 'downloading'}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${region.status === 'downloaded'
                                        ? 'bg-white/5 text-red-400 hover:bg-red-500/20 border border-white/10' // Estado: Borrar
                                        : region.status === 'downloading'
                                            ? 'bg-jaguar-900 border border-jaguar-500' // Estado: Cargando
                                            : 'bg-jaguar-500 text-jaguar-950 hover:bg-white' // Estado: Descargar
                                    }`}
                            >
                                {/* Lógica de Iconos del Botón */}
                                {region.status === 'idle' && <Download size={20} strokeWidth={2.5} />}
                                {region.status === 'downloaded' && <Trash2 size={20} />}
                                {region.status === 'downloading' && (
                                    <div className="relative flex items-center justify-center">
                                        {/* Spinner personalizado */}
                                        <div className="absolute w-8 h-8 border-2 border-jaguar-500/30 rounded-full"></div>
                                        <div className="absolute w-8 h-8 border-t-2 border-jaguar-500 rounded-full animate-spin"></div>
                                        <span className="text-[8px] font-bold text-jaguar-500 mt-0.5">{region.progress}%</span>
                                    </div>
                                )}
                            </button>

                        </div>

                        {/* Barra de progreso inferior (Solo visible cargando) */}
                        {region.status === 'downloading' && (
                            <div className="absolute bottom-0 left-0 h-1 bg-jaguar-500 transition-all duration-200" style={{ width: `${region.progress}%` }} />
                        )}
                    </div>
                ))}

                {/* Mensaje de Ayuda */}
                <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-8">
                    <AlertCircle className="text-blue-400 shrink-0" size={20} />
                    <p className="text-xs text-blue-200 leading-relaxed">
                        <strong className="block mb-1 text-blue-100">Modo Supervivencia</strong>
                        Las zonas descargadas funcionan sin señal de celular. Incluyen mapas topográficos, senderos y puntos de ayuda.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default OfflineManager;
