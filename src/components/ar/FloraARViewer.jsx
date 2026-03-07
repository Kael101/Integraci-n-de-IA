// src/components/ar/FloraARViewer.jsx
/**
 * FLORA AR VIEWER — Territorio Jaguar
 * =====================================
 * Visualizador de Realidad Aumentada para Flora Sagrada Shuar.
 *
 * Basado en el mismo patrón que AstroAR.jsx:
 * - Feed de cámara trasera como fondo HTML (getUserMedia)
 * - Canvas React Three Fiber superpuesto (z-10)
 * - DeviceOrientationControls para control de cámara con acelerómetro
 * - Nodos 3D procedurales por tipo de planta (vine/shrub/tree)
 * - Detección GPS vía useFloraProximity hook
 *
 * === UNITY / ARCORE BRIDGE (FUTURE NATIVE) ===
 * Para migrar a app nativa Unity + ARCore:
 * 1. Este componente detecta waypoints y los serializa a JSON
 * 2. Enviar al WebView nativo:
 *    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'FLORA_WAYPOINT', payload: waypoint }))
 * 3. Unity recibe el evento y ancla el .glb en el plano ARCore detectado:
 *    UnitySendMessage('ARFloraManager', 'OnWaypointActivated', jsonString)
 * 4. ARCore PlaneDetection coloca el modelo en el suelo real (WorldAnchor)
 * 5. Los datos etnobotánicos se pasan al UI nativo de Unity via el mismo canal
 * ============================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import {
    ChevronLeft, Leaf, Compass, MapPin, Info, X,
    Zap, BookOpen, Heart, AlertCircle
} from 'lucide-react';
import { useFloraProximity } from '../../hooks/useFloraProximity';

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS: 3D GEOMETRIES
// ─────────────────────────────────────────────────────────────────

/** Geometría procedural: Liana / Enredadera (vine) */
const VineGeometry = ({ color, glowColor, onClick }) => {
    const groupRef = useRef();
    const time = useRef(0);

    useFrame((_, delta) => {
        time.current += delta;
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.3;
            groupRef.current.position.y = Math.sin(time.current * 0.8) * 0.2;
        }
    });

    const segments = 8;
    const helixPoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= segments * 12; i++) {
            const t = i / (segments * 12);
            pts.push(new THREE.Vector3(
                Math.sin(t * Math.PI * segments * 2) * 0.4,
                t * 4 - 2,
                Math.cos(t * Math.PI * segments * 2) * 0.4
            ));
        }
        return pts;
    }, []);

    const curve = useMemo(() => new THREE.CatmullRomCurve3(helixPoints), [helixPoints]);
    const tubeGeom = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.06, 8, false), [curve]);

    return (
        <group ref={groupRef} onClick={onClick}>
            <mesh geometry={tubeGeom}>
                <meshStandardMaterial
                    color={color}
                    emissive={glowColor}
                    emissiveIntensity={0.4}
                    roughness={0.4}
                    metalness={0.1}
                />
            </mesh>
            {/* Hojas en puntos de la liana */}
            {[0.2, 0.45, 0.7].map((t, i) => {
                const pt = curve.getPoint(t);
                return (
                    <mesh key={i} position={pt} rotation={[0, i * 1.2, Math.PI / 4]}>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial
                            color="#2D6A4F"
                            emissive="#74C69D"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                );
            })}
            {/* Halo */}
            <mesh>
                <sphereGeometry args={[1.2, 16, 16]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.05} wireframe />
            </mesh>
        </group>
    );
};

/** Geometría procedural: Arbusto (shrub) */
const ShrubGeometry = ({ color, glowColor, onClick }) => {
    const groupRef = useRef();
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
            groupRef.current.children.forEach((child, i) => {
                child.position.y = Math.sin(clock.getElapsedTime() * 1.2 + i) * 0.08;
            });
        }
    });

    const clusters = useMemo(() => [
        { pos: [0, 0, 0], r: 0.8 },
        { pos: [0.6, 0.3, 0.2], r: 0.55 },
        { pos: [-0.5, 0.2, 0.3], r: 0.5 },
        { pos: [0.1, 0.7, 0], r: 0.65 },
        { pos: [-0.2, -0.2, 0.5], r: 0.45 },
    ], []);

    return (
        <group ref={groupRef} onClick={onClick}>
            {/* Tallo */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.14, 0.8, 8]} />
                <meshStandardMaterial color="#5C3D1A" roughness={0.9} />
            </mesh>
            {/* Masa foliada */}
            {clusters.map((c, i) => (
                <mesh key={i} position={c.pos}>
                    <sphereGeometry args={[c.r, 10, 10]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={glowColor}
                        emissiveIntensity={0.25}
                        roughness={0.7}
                    />
                </mesh>
            ))}
            {/* Flores pequeñas */}
            {[[-0.3, 0.9, 0.2], [0.4, 1.1, -0.1], [-0.6, 0.6, -0.3]].map((pos, i) => (
                <mesh key={`f-${i}`} position={pos}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial color={glowColor} />
                </mesh>
            ))}
            <pointLight color={glowColor} intensity={0.8} distance={3} />
        </group>
    );
};

/** Geometría procedural: Árbol (tree) */
const TreeGeometry = ({ color, glowColor, onClick }) => {
    const groupRef = useRef();
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.08;
        }
    });

    return (
        <group ref={groupRef} onClick={onClick}>
            {/* Tronco */}
            <mesh position={[0, -1.5, 0]}>
                <cylinderGeometry args={[0.18, 0.28, 2, 10]} />
                <meshStandardMaterial color="#6B4226" roughness={0.95} />
            </mesh>
            {/* Ramas secundarias */}
            {[
                { pos: [0.5, -0.4, 0], rot: [0, 0, Math.PI / 4] },
                { pos: [-0.5, -0.3, 0.2], rot: [0, 0.5, -Math.PI / 4] },
                { pos: [0.2, -0.1, -0.4], rot: [0.4, 0, Math.PI / 5] },
            ].map((b, i) => (
                <mesh key={i} position={b.pos} rotation={b.rot}>
                    <cylinderGeometry args={[0.06, 0.1, 0.8, 7]} />
                    <meshStandardMaterial color="#6B4226" roughness={0.95} />
                </mesh>
            ))}
            {/* Copa — capas */}
            {[
                { pos: [0, 0.5, 0], r: 1.2 },
                { pos: [0, 1.3, 0], r: 0.9 },
                { pos: [0, 1.9, 0], r: 0.55 },
            ].map((layer, i) => (
                <mesh key={`c-${i}`} position={layer.pos}>
                    <coneGeometry args={[layer.r, layer.r * 1.4, 10]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={glowColor}
                        emissiveIntensity={0.2}
                        roughness={0.7}
                    />
                </mesh>
            ))}
            {/* Flores colgantes */}
            {[[0.6, 0.8, 0.3], [-0.7, 0.6, -0.2], [0.1, 0.2, 0.8]].map((pos, i) => (
                <mesh key={`fl-${i}`} position={pos}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color={glowColor} />
                </mesh>
            ))}
            <pointLight color={glowColor} intensity={1.0} distance={4} position={[0, 1, 0]} />
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────
// FLORA NODE: Nodo completo en escena (geometría + label + glow halo)
// ─────────────────────────────────────────────────────────────────
const FloraNode = ({ waypoint, onSelect }) => {
    const { scene3D, color, glowColor, modelType, speciesShuar, distance } = waypoint;
    const nodeRef = useRef();

    useFrame(({ clock }) => {
        if (nodeRef.current) {
            nodeRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.9) * 0.15;
        }
    });

    const GeomComponent = {
        vine: VineGeometry,
        shrub: ShrubGeometry,
        tree: TreeGeometry,
    }[modelType] || ShrubGeometry;

    const handleClick = (e) => { e.stopPropagation(); onSelect(waypoint); };

    return (
        <group position={[scene3D.x, scene3D.y, scene3D.z]} ref={nodeRef}>
            <GeomComponent color={color} glowColor={glowColor} onClick={handleClick} />

            {/* Label flotante (Billboard siempre mira a cámara) */}
            <Billboard position={[0, 2.8, 0]}>
                <Text
                    fontSize={0.35}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#000"
                    maxWidth={3}
                    textAlign="center"
                    onClick={handleClick}
                >
                    {speciesShuar}
                </Text>
                <Text
                    fontSize={0.22}
                    color={glowColor}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -0.45, 0]}
                    outlineWidth={0.02}
                    outlineColor="#000"
                    onClick={handleClick}
                >
                    {distance}m
                </Text>
            </Billboard>

            {/* Particle ring animado */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
                <torusGeometry args={[1.0, 0.03, 8, 48]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

// ─────────────────────────────────────────────────────────────────
// DEVICE ORIENTATION CONTROLS (idéntico a AstroAR.jsx)
// ─────────────────────────────────────────────────────────────────
const DeviceOrientationControls = () => {
    const { camera } = useThree();
    useEffect(() => {
        const handler = (event) => {
            if (!event.alpha) return;
            const alpha = THREE.MathUtils.degToRad(event.alpha);
            const beta = THREE.MathUtils.degToRad(event.beta);
            const gamma = THREE.MathUtils.degToRad(event.gamma);
            const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;
            const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
            const q1 = new THREE.Quaternion().setFromEuler(euler);
            const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
            camera.quaternion.multiplyQuaternions(q1, q2);
        };
        window.addEventListener('deviceorientation', handler);
        return () => window.removeEventListener('deviceorientation', handler);
    }, [camera]);
    return null;
};

// ─────────────────────────────────────────────────────────────────
// CAMERA FEED (reutilizado del patrón de AstroAR)
// ─────────────────────────────────────────────────────────────────
const CameraFeed = () => {
    const videoRef = useRef(null);
    const [camError, setCamError] = useState(null);

    useEffect(() => {
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) {
                setCamError('Cámara no disponible. Asegúrate de dar permisos.');
            }
        };
        start();
        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    if (camError) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 to-slate-900 flex items-center justify-center">
                <p className="text-white/60 text-sm text-center px-8">{camError}<br /><span className="text-xs mt-1 block opacity-50">Usando fondo de selva simulado.</span></p>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover z-0"
        />
    );
};

// ─────────────────────────────────────────────────────────────────
// SPECIES INFO DRAWER — Detalle etnobotánico al tocar planta
// ─────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
    sagrado: { label: 'Planta Sagrada', color: '#C77DFF', bg: 'rgba(124,36,202,0.2)' },
    medicinal: { label: 'Medicinal', color: '#74C69D', bg: 'rgba(45,106,79,0.25)' },
    alimentario: { label: 'Alimentario', color: '#FFB703', bg: 'rgba(255,183,3,0.15)' },
};

const SpeciesDrawer = ({ species, onClose }) => {
    if (!species) return null;
    const cat = CATEGORY_CONFIG[species.category] || CATEGORY_CONFIG.medicinal;

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
            <div
                className="w-full max-w-lg pointer-events-auto"
                style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >
                <div
                    className="rounded-t-3xl border border-white/10 p-6 overflow-y-auto"
                    style={{
                        background: 'rgba(5, 15, 10, 0.92)',
                        backdropFilter: 'blur(24px)',
                        maxHeight: '78vh',
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                            <div
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-2"
                                style={{ color: cat.color, background: cat.bg }}
                            >
                                <Leaf size={11} />
                                {cat.label}
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">
                                {species.speciesShuar}
                            </h2>
                            <p className="text-emerald-400 text-sm italic mt-0.5">
                                {species.speciesScientific}
                            </p>
                            <p className="text-white/50 text-xs mt-0.5">
                                {species.commonName} — {species.distance}m
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tagline */}
                    <div
                        className="p-4 rounded-2xl mb-4 border"
                        style={{ background: cat.bg, borderColor: `${cat.color}30` }}
                    >
                        <p className="text-white font-semibold italic text-center" style={{ color: cat.color }}>
                            "{species.tagline}"
                        </p>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={14} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Descripción</h3>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{species.description}</p>
                    </div>

                    {/* Uso Medicinal */}
                    <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/30 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart size={14} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Uso Medicinal / Ritual</h3>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">{species.medicinalUse}</p>
                    </div>

                    {/* Mitología */}
                    <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/30 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-purple-400" />
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Cosmovisión Shuar</h3>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed italic">{species.mythology}</p>
                    </div>

                    {/* Acción */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all"
                        style={{ background: `linear-gradient(135deg, ${cat.color}AA, ${cat.color}55)`, border: `1px solid ${cat.color}50` }}
                    >
                        Seguir Explorando
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
// HUD: Compass indicator + waypoints activos
// ─────────────────────────────────────────────────────────────────
const FloraHUD = ({ nearbyWaypoints, allWaypoints, userPos, accuracy, onSelectWaypoint }) => {
    const nearest = allWaypoints[0];

    return (
        <>
            {/* Top Bar */}
            <div className="absolute top-16 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
                <div
                    className="px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-emerald-300 border border-emerald-500/30"
                    style={{ background: 'rgba(5,20,12,0.75)', backdropFilter: 'blur(12px)' }}
                >
                    <Leaf size={13} className="text-emerald-400" />
                    AR FLORA SHUAR
                </div>
                <div
                    className="px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-white/70 border border-white/10"
                    style={{ background: 'rgba(5,20,12,0.75)', backdropFilter: 'blur(12px)' }}
                >
                    <Compass size={12} className="text-emerald-500" />
                    {nearbyWaypoints.length > 0
                        ? `${nearbyWaypoints.length} activa${nearbyWaypoints.length > 1 ? 's' : ''}`
                        : 'Explorando...'}
                </div>
            </div>

            {/* Flecha de dirección al más cercano */}
            {nearest && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 pointer-events-none">
                    <div
                        className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-white/10 text-center"
                        style={{ background: 'rgba(5,20,12,0.80)', backdropFilter: 'blur(12px)' }}
                    >
                        <Compass size={20} className="text-emerald-400" />
                        <p className="text-[10px] font-bold text-emerald-400">{Math.round(nearest.bearing)}°</p>
                        <p className="text-[9px] text-white/50">{nearest.distance}m</p>
                        <p className="text-[8px] text-white/40 max-w-[50px] leading-tight">{nearest.speciesShuar}</p>
                    </div>
                </div>
            )}

            {/* Accuracy badge */}
            {accuracy && (
                <div className="absolute top-28 left-4 z-20 pointer-events-none">
                    <div className="px-2 py-1 rounded-full text-[9px] text-white/40 border border-white/5"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        GPS ±{accuracy}m
                    </div>
                </div>
            )}

            {/* Bottom waypoint list (si no hay ninguno activo) */}
            {nearbyWaypoints.length === 0 && nearest && (
                <div className="absolute bottom-28 left-4 right-4 z-20 pointer-events-none">
                    <div
                        className="p-4 rounded-2xl border border-white/10 flex items-center gap-3"
                        style={{ background: 'rgba(5,20,12,0.80)', backdropFilter: 'blur(12px)' }}
                    >
                        <MapPin size={20} className="text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-white">Más Cercana: {nearest.speciesShuar}</p>
                            <p className="text-[10px] text-white/50 mt-0.5">
                                A {nearest.distance}m — acércate para activar el overlay AR
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT: FloraARViewer
// ─────────────────────────────────────────────────────────────────
export default function FloraARViewer({ onClose }) {
    const [started, setStarted] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState(null);

    // En web/dev: simulate=true para que siempre se vean waypoints activos
    // En producción: simulate=false para usar GPS real
    const simulate = import.meta.env.DEV;
    const { userPos, nearbyWaypoints, allWaypoints, error, accuracy, isReady } =
        useFloraProximity({ simulate });

    const handleStart = async () => {
        if (
            typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                if (perm === 'granted') setStarted(true);
                else alert('Se necesitan permisos de orientación para el AR.');
            } catch {
                setStarted(true);
            }
        } else {
            setStarted(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden font-sans">
            {/* 1. Camera feed */}
            <CameraFeed />

            {/* 2. R3F Canvas */}
            <div className="absolute inset-0 z-10">
                <Canvas
                    camera={{ position: [0, 0, 0], fov: 75 }}
                    onClick={() => setSelectedSpecies(null)}
                >
                    <ambientLight intensity={0.6} />
                    <pointLight position={[0, 5, 0]} intensity={1.2} color="#a8edca" />

                    {started && <DeviceOrientationControls />}

                    {/* Renderizar solo waypoints activos (en rango) en DEV muestro todos */}
                    {isReady &&
                        (simulate ? allWaypoints : nearbyWaypoints).map((wp) => (
                            <FloraNode
                                key={wp.id}
                                waypoint={wp}
                                onSelect={setSelectedSpecies}
                            />
                        ))}
                </Canvas>
            </div>

            {/* 3. UI Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Back button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-3 rounded-full border border-white/20 text-white pointer-events-auto transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
                >
                    <ChevronLeft size={22} />
                </button>

                {/* HUD */}
                {isReady && (
                    <FloraHUD
                        nearbyWaypoints={nearbyWaypoints}
                        allWaypoints={allWaypoints}
                        userPos={userPos}
                        accuracy={accuracy}
                        onSelectWaypoint={setSelectedSpecies}
                    />
                )}

                {/* Error GPS banner */}
                {error && (
                    <div className="absolute bottom-32 left-4 right-4 pointer-events-none">
                        <div
                            className="px-4 py-2 rounded-xl flex items-center gap-2 text-xs text-amber-300 border border-amber-500/20"
                            style={{ background: 'rgba(30,20,0,0.8)', backdropFilter: 'blur(8px)' }}
                        >
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Welcome / Start Screen */}
            {!started && (
                <div className="absolute inset-0 z-40 flex items-center justify-center"
                    style={{ background: 'rgba(2, 10, 6, 0.85)', backdropFilter: 'blur(10px)' }}>
                    <div
                        className="text-center p-8 rounded-3xl border border-emerald-500/25 max-w-sm mx-6 shadow-2xl"
                        style={{ background: 'rgba(5,20,12,0.9)' }}
                    >
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center text-5xl"
                            style={{ background: 'linear-gradient(135deg, #2D6A4F, #1B4332)' }}>
                            🌿
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-1">Flora Shuar</h2>
                        <p className="text-emerald-400 text-sm font-medium mb-1">Realidad Aumentada · AR</p>
                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                            Descubre las plantas sagradas de los Shuar en tu entorno.
                            Acércate a los waypoints para ver overlays 3D y su historia ancestral.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleStart}
                                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-xl transition-all active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                                    boxShadow: '0 8px 32px rgba(64,145,108,0.35)',
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Zap size={16} /> Activar AR Flora
                                </span>
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2 rounded-2xl font-medium text-white/50 text-sm hover:text-white/70 transition-colors"
                            >
                                Volver al mapa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Species Detail Drawer */}
            {selectedSpecies && (
                <div className="absolute inset-0 z-50 pointer-events-auto">
                    <SpeciesDrawer
                        species={selectedSpecies}
                        onClose={() => setSelectedSpecies(null)}
                    />
                </div>
            )}
        </div>
    );
}
