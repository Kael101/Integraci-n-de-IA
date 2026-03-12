/**
 * ARScannerView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Escáner de Realidad Aumentada para Estaciones de Fauna de Territorio Jaguar.
 *
 * ARQUITECTURA:
 *  - Scripts A-Frame + AR.js cargados dinámicamente (igual que MindARViewer)
 *    para no bloquear el bundle inicial.
 *  - Comunicación A-Frame → React vía CustomEvent ('ar-reward-claimed').
 *    Esto desacopla el mundo DOM de A-Frame del árbol de React.
 *  - Componente A-Frame 'reward-trigger' registrado una sola vez en window.AFRAME.
 *  - Recompensa blockeada con hasClaimed (anti-spam FIFO-safe).
 *  - earnCoins() inyecta el lote en el vault FIFO de useJaguarCoins.
 *  - addXP() suma al historial de useGamification (alimentos el leaderboard semanal).
 *
 * MARCADORES FÍSICOS:
 *  Cada estación del sendero lleva un marcador impreso.
 *  La prop `station` define qué marcador y qué animal/recompensa se asocia.
 *  stations disponibles: jaguar | tapir | condor | mariposa | serpiente
 *
 * USO:
 *  <ARScannerView station="jaguar" onClose={() => setShowAR(false)} />
 *
 * PROPS:
 *  @param {string}   [station='jaguar']  — ID de la estación a escanear
 *  @param {function} onClose             — Callback al cerrar el escáner
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Zap, AlertTriangle, CheckCircle2, ScanLine } from 'lucide-react';
import { useJaguarCoins } from '../../hooks/useJaguarCoins';
import { useGamification } from '../../hooks/useGamification';

// ─── Catálogo de Estaciones AR ────────────────────────────────────────────────
// Cada estación corresponde a un marcador barcode impreso en la señalética del sendero.
// `barcodeId` es el valor del <a-marker type="barcode" value="N">.
const AR_STATIONS = {
    jaguar: {
        barcodeId: 6,
        animal: 'Jaguar Amazónico',
        binomial: 'Panthera onca',
        emoji: '🐆',
        coins: 50,
        xp: 100,
        color: '#f59e0b',   // ámbar — color del jaguar
        glowColor: 'rgba(245, 158, 11, 0.4)',
        description: 'Depredador ápice de la Amazonía. Indicador clave de salud ecosistémica.',
        modelColor: '#f59e0b',
    },
    tapir: {
        barcodeId: 7,
        animal: 'Tapir Amazónico',
        binomial: 'Tapirus terrestris',
        emoji: '🦏',
        coins: 30,
        xp: 60,
        color: '#6366f1',
        glowColor: 'rgba(99, 102, 241, 0.4)',
        description: 'El "jardinero del bosque". Dispersa semillas a través del territorio.',
        modelColor: '#6366f1',
    },
    condor: {
        barcodeId: 8,
        animal: 'Cóndor Andino',
        binomial: 'Vultur gryphus',
        emoji: '🦅',
        coins: 40,
        xp: 80,
        color: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.4)',
        description: 'El vigía de los Andes. Con 3m de envergadura, puede ver 5km de distancia.',
        modelColor: '#ec4899',
    },
    mariposa: {
        barcodeId: 9,
        animal: 'Mariposa Morpho',
        binomial: 'Morpho menelaus',
        emoji: '🦋',
        coins: 20,
        xp: 40,
        color: '#22d3ee',
        glowColor: 'rgba(34, 211, 238, 0.4)',
        description: 'Sus alas producen color por nanoarquitectura, no por pigmento.',
        modelColor: '#22d3ee',
    },
    serpiente: {
        barcodeId: 10,
        animal: 'Boa Esmeralda',
        binomial: 'Corallus caninus',
        emoji: '🐍',
        coins: 35,
        xp: 70,
        color: '#22c55e',
        glowColor: 'rgba(34, 197, 94, 0.4)',
        description: 'Reguladora de roedores. Esencial para el equilibrio del bosque húmedo.',
        modelColor: '#22c55e',
    },
};

// ─── Carga dinámica de scripts (mismo patrón que MindARViewer) ────────────────
const _loadScript = (src) =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Script load failed: ${src}`));
        document.head.appendChild(s);
    });

// ─── Componente principal ─────────────────────────────────────────────────────

const ARScannerView = ({ station = 'jaguar', onClose }) => {
    const stationData = AR_STATIONS[station] ?? AR_STATIONS.jaguar;

    const { earnCoins } = useJaguarCoins();
    const { addXP } = useGamification();

    const [phase, setPhase] = useState('loading'); // 'loading' | 'scanning' | 'error' | 'claimed'
    const [errorMsg, setErrorMsg] = useState('');
    const [hasClaimed, setHasClaimed] = useState(false);
    const [earnedReward, setEarnedReward] = useState(null);
    const hasClaimedRef = useRef(false); // Ref for use inside the CustomEvent listener (no stale closure)

    // ─── Script loading ───────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                // 1. A-Frame primero (requerimiento de AR.js)
                await _loadScript('https://aframe.io/releases/1.5.0/aframe.min.js');
                // 2. AR.js plugin para A-Frame
                await _loadScript('https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js');
                if (!cancelled) setPhase('scanning');
            } catch (err) {
                console.error('[ARScannerView] Error cargando scripts de AR:', err);
                if (!cancelled) {
                    setErrorMsg('No se pudo cargar el motor de AR. Verifica tu conexión e intenta de nuevo.');
                    setPhase('error');
                }
            }
        };

        init();
        return () => { cancelled = true; };
    }, []);

    // ─── Registro de componente A-Frame + listener de reward ──────────────────
    useEffect(() => {
        if (phase !== 'scanning') return;

        // Registrar el componente 'reward-trigger' solo una vez en el runtime de A-Frame
        if (window.AFRAME && !window.AFRAME.components['reward-trigger']) {
            window.AFRAME.registerComponent('reward-trigger', {
                init() {
                    this.el.addEventListener('click', () => {
                        window.dispatchEvent(new CustomEvent('ar-reward-claimed', {
                            detail: {
                                station: this.el.getAttribute('data-station'),
                            },
                        }));
                    });
                },
            });
        }

        // Listener React — desacoplado de A-Frame por CustomEvent
        const handleReward = (e) => {
            if (hasClaimedRef.current) return; // anti-spam: solo una vez
            hasClaimedRef.current = true;

            const { coins, xp, animal } = stationData;

            // Inyectar en el vault FIFO de Jaguar Coins
            earnCoins(coins, 'ar_station', `Descubrimiento AR: ${animal}`);
            // Sumar XP al historial de gamificación (alimenta el leaderboard semanal)
            addXP(xp);

            setEarnedReward({ coins, xp, animal });
            setHasClaimed(true);
            setPhase('claimed');
        };

        window.addEventListener('ar-reward-claimed', handleReward);
        return () => window.removeEventListener('ar-reward-claimed', handleReward);
    }, [phase, stationData, earnCoins, addXP]);

    // ─── Cleanup de cámara al desmontar ──────────────────────────────────────
    useEffect(() => {
        return () => {
            // Detener todos los tracks del stream de video (libera la cámara)
            document.querySelectorAll('video').forEach(vid => {
                if (vid.srcObject) {
                    vid.srcObject.getTracks().forEach(t => t.stop());
                }
                vid.remove();
            });
            // Eliminar la escena A-Frame del DOM
            const scene = document.querySelector('a-scene');
            if (scene) scene.parentNode?.removeChild(scene);
        };
    }, []);

    // ─── Render: Pantalla de Loading ──────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="fixed inset-0 z-[9999] bg-jaguar-950 flex flex-col items-center justify-center gap-6 animate-fade-in">
                <button onClick={onClose} className="absolute top-5 right-5 p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors">
                    <X size={20} />
                </button>
                {/* Icono animado */}
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-jaguar-500/30 flex items-center justify-center">
                        <span className="text-5xl animate-pulse">{stationData.emoji}</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-jaguar-500 border-t-transparent animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-white font-bold text-lg">Iniciando Escáner AR</p>
                    <p className="text-white/40 text-sm mt-1">Cargando motor de Realidad Aumentada…</p>
                </div>
                {/* Barra de progreso indeterminada */}
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-jaguar-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
                        style={{ width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
            </div>
        );
    }

    // ─── Render: Error ────────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="fixed inset-0 z-[9999] bg-jaguar-950 flex flex-col items-center justify-center gap-6 p-8 text-center">
                <AlertTriangle size={48} className="text-red-400" />
                <div>
                    <p className="text-white font-bold text-lg mb-2">Error de AR</p>
                    <p className="text-white/50 text-sm">{errorMsg}</p>
                </div>
                <button onClick={onClose}
                    className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-white font-bold hover:bg-white/20 transition-colors">
                    Cerrar
                </button>
            </div>
        );
    }

    // ─── Render: Claimed (recompensa obtenida) ────────────────────────────────
    if (phase === 'claimed') {
        return (
            <div className="fixed inset-0 z-[9999] bg-jaguar-950 flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
                {/* Glow de fondo */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${stationData.glowColor} 0%, transparent 70%)` }} />

                <div className="relative">
                    <span className="text-8xl">{stationData.emoji}</span>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={18} className="text-white" />
                    </div>
                </div>

                <div className="relative">
                    <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">Descubrimiento AR</p>
                    <h2 className="font-display font-black text-3xl text-white mb-1">{earnedReward?.animal}</h2>
                    <p className="text-white/40 text-sm italic">{stationData.binomial}</p>
                </div>

                {/* Tarjeta de Recompensa */}
                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-xs backdrop-blur-md">
                    <div className="absolute inset-0 rounded-2xl"
                        style={{ boxShadow: `inset 0 0 20px ${stationData.glowColor}` }} />
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3 relative">Recompensas Obtenidas</p>
                    <div className="flex justify-around relative">
                        <div className="text-center">
                            <p className="font-black text-2xl text-amber-400">{earnedReward?.coins}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">🪙 Jaguar Coins</p>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                            <p className="font-black text-2xl text-jaguar-400">{earnedReward?.xp}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">⚡ XP</p>
                        </div>
                    </div>
                </div>

                {/* Dato educativo */}
                <p className="text-white/40 text-sm max-w-xs leading-relaxed relative">
                    💡 {stationData.description}
                </p>

                <button onClick={onClose}
                    className="px-8 py-4 rounded-2xl font-black text-jaguar-950 text-sm uppercase tracking-widest transition-all active:scale-95"
                    style={{ background: stationData.color }}>
                    Volver al Mapa
                </button>
            </div>
        );
    }

    // ─── Render: Escena AR activa ─────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">

            {/* ── UI Overlay (siempre encima de A-Frame) ── */}

            {/* Botón cerrar */}
            <button
                onClick={onClose}
                className="absolute top-5 right-5 z-[10001] p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-black/70 transition-colors"
            >
                <X size={20} />
            </button>

            {/* Chip de identificación de la estación */}
            <div className="absolute top-5 left-5 z-[10001] flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-lg">{stationData.emoji}</span>
                <div>
                    <p className="text-white font-bold text-xs leading-none">{stationData.animal}</p>
                    <p className="text-white/40 text-[10px] leading-none mt-0.5">Estación AR</p>
                </div>
            </div>

            {/* Instrucción de escaneo */}
            <div className="absolute bottom-16 left-4 right-4 z-[10001] pointer-events-none">
                <div className="flex flex-col items-center gap-3">
                    {/* Icono de escaneo pulsante */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
                        <ScanLine size={16} className="text-jaguar-400 animate-pulse" />
                        <span className="text-white text-xs font-bold">
                            Apunta al marcador en el sendero
                        </span>
                    </div>
                    {/* Premio previsualization */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                        <div className="flex items-center gap-1">
                            <span className="text-amber-400 font-black text-sm">+{stationData.coins}</span>
                            <span className="text-white/40 text-[10px]">🪙</span>
                        </div>
                        <div className="w-px h-3 bg-white/20" />
                        <div className="flex items-center gap-1">
                            <Zap size={10} className="text-jaguar-400" />
                            <span className="text-jaguar-400 font-black text-sm">+{stationData.xp} XP</span>
                        </div>
                        <div className="w-px h-3 bg-white/20" />
                        <span className="text-white/30 text-[10px]">Al tocar el {stationData.animal}</span>
                    </div>
                </div>
            </div>

            {/* ── Escena A-Frame (ocupa todo el viewport) ── */}
            {/*
             * NOTA: A-Frame usa custom elements (<a-scene>, <a-marker> etc.)
             * que React 18 pasa al DOM sin modificar, lo que es correcto.
             * El atributo `cursor="rayOrigin: mouse"` habilita el tap en móvil.
             */}
            <a-scene
                embedded
                arjs={`sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;`}
                cursor="rayOrigin: mouse"
                vr-mode-ui="enabled: false"
                device-orientation-permission-ui="enabled: false"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000 }}
            >
                {/*
                 * Marcador Barcode — valor debe coincidir con el impreso en el sendero.
                 * Generá tus marcadores en: https://ar-js-org.github.io/AR.js/three.js/examples/marker-training/marker_trainer/
                 */}
                <a-marker
                    type="barcode"
                    value={String(stationData.barcodeId)}
                    smooth="true"
                    smoothCount="10"
                >
                    {/*
                     * Modelo 3D del animal.
                     * En producción: reemplazar <a-box> por <a-gltf-model src="url/jaguar.glb">
                     * Los .glb deberían estar en /public/models/
                     */}
                    <a-box
                        position="0 0.5 0"
                        scale="0.8 0.8 0.8"
                        material={`color: ${stationData.modelColor}; metalness: 0.3; roughness: 0.5;`}
                        animation="property: rotation; to: 0 360 0; loop: true; dur: 3500; easing: linear"
                        reward-trigger
                        data-station={station}
                        className="clickable"
                    />

                    {/* Texto flotante educativo */}
                    <a-text
                        value={`${stationData.emoji} ${stationData.animal}\n${stationData.binomial}\n¡Tócame para reclamar!`}
                        position="0 1.8 0"
                        align="center"
                        color="#ffffff"
                        scale="0.8 0.8 0.8"
                        look-at="[camera]"
                    />

                    {/* Plano de sombra debajo del modelo */}
                    <a-circle
                        position="0 0 0"
                        rotation="-90 0 0"
                        radius="0.6"
                        material={`color: ${stationData.modelColor}; opacity: 0.2; transparent: true;`}
                    />
                </a-marker>

                {/* Cámara con cursor interno para ray-casting en mobile */}
                <a-entity camera>
                    <a-cursor
                        visible="false"
                        raycaster="objects: .clickable"
                        fuse="false"
                    />
                </a-entity>
            </a-scene>
        </div>
    );
};

export default ARScannerView;
