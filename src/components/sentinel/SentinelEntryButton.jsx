import React from 'react';
import { Shield, Eye } from 'lucide-react';

/**
 * SentinelEntryButton
 * ─────────────────────────────────────────────────────────────────────────────
 * Botón discreto que abre el flujo Centinela del Jaguar desde el mapa.
 * Incluye modal de aviso legal de anonimato antes de continuar.
 */
const SentinelEntryButton = ({ onConfirm }) => {
    const [showLegal, setShowLegal] = React.useState(false);

    return (
        <>
            {/* Botón flotante discreto — ícono de ojo de jaguar */}
            <button
                onClick={() => setShowLegal(true)}
                title="Centinela del Jaguar — Reportar actividad ilegal"
                className="group w-12 h-12 bg-jaguar-950/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 hover:border-emerald-400/60 hover:bg-jaguar-900/90"
                style={{ boxShadow: '0 0 18px rgba(16,185,129,0.15)' }}
            >
                {/* Ojo de jaguar SVG */}
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                    <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#10b981" strokeWidth="1.5" />
                    <ellipse cx="12" cy="12" rx="3" ry="5" fill="#10b981" opacity="0.9" />
                    <ellipse cx="12" cy="12" rx="1.2" ry="4" fill="#064e3b" />
                    <circle cx="11" cy="10.5" r="0.7" fill="white" opacity="0.7" />
                </svg>
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-emerald-400/0 group-hover:text-emerald-400/80 transition-colors whitespace-nowrap">
                    Centinela
                </span>
            </button>

            {/* Modal de Aviso Legal */}
            {showLegal && (
                <div className="fixed inset-0 z-[90] bg-jaguar-950/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-jaguar-900 border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl"
                        style={{ boxShadow: '0 0 60px rgba(16,185,129,0.1)' }}>

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                                <Shield className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-1">
                                    Protocolo Seguro
                                </p>
                                <h2 className="text-xl font-black uppercase italic text-white leading-tight">
                                    Centinela<br />del Jaguar
                                </h2>
                            </div>
                        </div>

                        {/* Aviso Legal */}
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 mb-6">
                            <div className="flex gap-3 items-start mb-3">
                                <Eye className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <p className="text-[13px] font-semibold text-white/90 leading-relaxed">
                                    Tu reporte será <span className="text-emerald-400 font-black">completamente anónimo</span>.
                                    Los metadatos de ubicación serán cifrados con AES-256 para proteger tu identidad.
                                </p>
                            </div>
                            <ul className="space-y-2 ml-7">
                                {[
                                    'La foto NO se guarda en tu galería',
                                    'Solo tú tienes la clave de descifrado',
                                    'El reporte viaja cifrado al servidor'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[11px] text-white/60 font-medium">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLegal(false)}
                                className="flex-1 py-4 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white/70 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { setShowLegal(false); onConfirm(); }}
                                className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-[11px] font-black uppercase tracking-widest text-jaguar-950 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                                style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
                            >
                                Entendido — Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SentinelEntryButton;
