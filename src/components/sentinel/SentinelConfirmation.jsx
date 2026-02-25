import React from 'react';
import { Send, ArrowLeft, Loader2, Lock } from 'lucide-react';

/**
 * SentinelConfirmation
 * ─────────────────────────────────────────────────────────────────────────────
 * Paso final: muestra thumbnail de la imagen, categoría elegida, y botón
 * de envío que cifra + guarda el reporte.
 */
const CATEGORY_LABELS = {
    deforestation: { emoji: '🌳', label: 'Tala / Deforestación', color: 'text-green-400' },
    machinery: { emoji: '🏗️', label: 'Maquinaria Pesada / Draga', color: 'text-orange-400' },
    water_pollution: { emoji: '💧', label: 'Contaminación de Río', color: 'text-blue-400' }
};

const SentinelConfirmation = ({ capturedImage, category, location, isSaving, onSubmit, onBack }) => {
    const cat = CATEGORY_LABELS[category] || {};

    return (
        <div className="fixed inset-0 z-[95] bg-jaguar-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/5">
                <button
                    onClick={onBack}
                    disabled={isSaving}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-40"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">Paso 3 de 3</p>
                    <h2 className="text-lg font-black uppercase italic text-white">Confirmar Reporte</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Preview de imagen */}
                {capturedImage && (
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src={capturedImage}
                            alt="Evidencia capturada"
                            className="w-full object-cover max-h-64"
                        />
                        {/* Badge de cifrado */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-emerald-500/30 rounded-xl px-3 py-1.5">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                AES-256
                            </span>
                        </div>
                    </div>
                )}

                {/* Resumen del reporte */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Datos del Reporte</h3>

                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Categoría</p>
                            <p className={`font-black uppercase text-sm ${cat.color}`}>{cat.label}</p>
                        </div>
                    </div>

                    {location && (
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📍</span>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Coordenadas</p>
                                <p className="font-mono text-[12px] text-white/80">
                                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🕐</span>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Timestamp</p>
                            <p className="font-mono text-[12px] text-white/80">
                                {new Date().toLocaleString('es-EC')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Estado</p>
                            <p className="font-black text-[12px] text-emerald-400">
                                Se cifrará antes de guardarse
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nota de impacto */}
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-white/60 leading-relaxed">
                        Este reporte será enviado a la{' '}
                        <strong className="text-emerald-400">Coalición de Protección Amazónica</strong>{' '}
                        y validado con imágenes satelitales de Morona Santiago.
                    </p>
                </div>
            </div>

            {/* Botón de envío */}
            <div className="p-6 border-t border-white/5">
                <button
                    onClick={onSubmit}
                    disabled={isSaving}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black uppercase tracking-widest text-jaguar-950 disabled:text-white/40 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl"
                    style={{ boxShadow: isSaving ? 'none' : '0 4px 24px rgba(16,185,129,0.4)' }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                            <span className="text-white/60">Cifrando y enviando...</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Enviar Reporte Cifrado
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SentinelConfirmation;
