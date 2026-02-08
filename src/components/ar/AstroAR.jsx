import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, Compass, Info, X, BookOpen } from 'lucide-react';

import { getStarPosition, BRIGHT_STARS } from '../../utils/astronomy';
import shuarConstellations from '../../data/shuarConstellations.json';

// --- Components ---

// Componente para renderizar una constelación interactiva
const Constellation = ({ data, location, date, onSelect }) => {
    // Calculamos las posiciones de las estrellas
    const starsPoints = useMemo(() => {
        return data.stars.map(star => {
            return getStarPosition(date, location, star.ra, star.dec, 100);
        });
    }, [data, location, date]);

    // Líneas
    const lines = data.lines.map(([startIdx, endIdx], i) => {
        const start = starsPoints[startIdx];
        const end = starsPoints[endIdx];
        if (!start || !end) return null;
        return (
            <Line
                key={`line-${i}`}
                points={[start, end]}
                color="#00ffcc"
                lineWidth={1.5}
                transparent
                opacity={0.6}
            />
        );
    });

    // Centro para Texto y Click Area
    const center = useMemo(() => {
        if (starsPoints.length === 0) return new THREE.Vector3(0, 0, -100);
        return starsPoints.reduce((acc, curr) => acc.clone().add(curr), new THREE.Vector3()).divideScalar(starsPoints.length);
    }, [starsPoints]);

    return (
        <group onClick={(e) => { e.stopPropagation(); onSelect(data); }}>
            {lines}
            {/* Puntos de estrellas */}
            {starsPoints.map((pos, i) => (
                <mesh key={`star-${i}`} position={pos}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshBasicMaterial color="#00ffcc" />
                </mesh>
            ))}

            {/* Texto Interactivo */}
            <Text
                position={center}
                color="white"
                fontSize={3}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="black"
            >
                {data.name}
            </Text>

            {/* Hitbox invisible para facilitar el click */}
            <mesh position={center} visible={false}>
                <sphereGeometry args={[10, 8, 8]} />
                <meshBasicMaterial color="red" wireframe />
            </mesh>
        </group>
    );
};

// --- Geometrías Estándar ---

// Geometría de la Chakana (Cruz Andina escalonada)
const ChakanaShape = ({ color = "gold", scale = 1, onClick }) => {
    // Construimos una forma 2D y la extruimos
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        // Definimos la mitad de la cruz para simplificar (simetría)
        // O dibujamos el contorno completo paso a paso.
        // Una chakana típica de 3 escalones.
        const step = 0.5;

        // Empezamos arriba centro
        s.moveTo(-step, 3 * step);
        s.lineTo(step, 3 * step);

        // Brazo derecho (baja, derecha, baja, derecha...)
        s.lineTo(step, step);
        s.lineTo(2 * step, step);
        s.lineTo(2 * step, -step); // Bajamos
        s.lineTo(step, -step);
        s.lineTo(step, -3 * step);

        // Parte abajo
        s.lineTo(-step, -3 * step);

        // Brazo izquierdo (sube, izquierda...)
        s.lineTo(-step, -step);
        s.lineTo(-2 * step, -step);
        s.lineTo(-2 * step, step);
        s.lineTo(-step, step);

        // Cierra
        s.lineTo(-step, 3 * step);

        return s;
    }, []);

    const extrudeSettings = { depth: 0.2 * scale, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05 * scale, bevelThickness: 0.05 * scale };

    return (
        <mesh onClick={onClick} scale={[scale, scale, scale]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Rotamos para que 'mire' al centro o hacia abajo según convenga. 
           En este caso la forma está en XY, al hacer LookAt se orientará bien. */}
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.2} />
        </mesh>
    );
};

// Componente Genérico para Símbolos Cósmicos
const CosmicSymbol = ({ data, onClick }) => {
    // Calcular posición en esfera (Azimut/Altitud fijos)
    const position = useMemo(() => {
        const rad = 80; // Un poco más cerca que las estrellas (100)

        // Convertir Az/Alt a Vector3 (Similar a astronomy.js pero con datos fijos)
        // Azimut: 0=Norte, 90=Este, 180=Sur.
        const az = THREE.MathUtils.degToRad(data.position.azimuth);
        const alt = THREE.MathUtils.degToRad(data.position.altitude);

        // x = R * cos(alt) * sin(az)
        // y = R * sin(alt)
        // z = -R * cos(alt) * cos(az)
        const x = rad * Math.cos(alt) * Math.sin(az);
        const y = rad * Math.sin(alt);
        const z = -rad * Math.cos(alt) * Math.cos(az);

        return new THREE.Vector3(x, y, z);
    }, [data]);

    // Calcular rotación para que mire al origen (0,0,0)
    // useLookAt es útil, o simplemente lookAt en ref
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.lookAt(0, 0, 0);
        }
    });

    // Animación de flotación suave
    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.position.y += Math.sin(clock.getElapsedTime()) * 0.01;
        }
    });

    return (
        <group position={position} ref={meshRef}>
            {data.type === 'chakana' ? (
                <ChakanaShape color={data.color} scale={data.scale} onClick={(e) => { e.stopPropagation(); onClick(data); }} />
            ) : (
                // Fallback: Esfera
                <mesh onClick={(e) => { e.stopPropagation(); onClick(data); }}>
                    <sphereGeometry args={[2, 16, 16]} />
                    <meshStandardMaterial color={data.color || "cyan"} wireframe />
                </mesh>
            )}

            {/* Texto Label */}
            <Text
                position={[0, -data.scale * 1.5, 0]} // Debajo del símbolo
                color="gold"
                fontSize={2}
                anchorX="center"
                anchorY="top"
                outlineWidth={0.1}
                outlineColor="black"
            >
                {data.name}
            </Text>
        </group>
    );
};

// Componente para estrellas reales individuales
const RealStars = ({ location, date }) => {
    return (
        <group>
            {BRIGHT_STARS.map((star, i) => {
                const pos = getStarPosition(date, location, star.ra, star.dec, 100);
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.6, 8, 8]} />
                        <meshBasicMaterial color={star.color} />
                    </mesh>
                );
            })}
        </group>
    );
};

// Componente: Feed de Cámara
const CameraFeed = () => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("No se pudo acceder a la cámara.");
            }
        };
        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    if (error) return <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white">{error}</div>;

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

// Componente: Control de Orientación
const DeviceOrientationControls = () => {
    const { camera } = useThree();

    useEffect(() => {
        const handleOrientation = (event) => {
            if (!event.alpha) return;

            const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
            const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
            const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;
            const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;

            const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
            const q1 = new THREE.Quaternion();
            q1.setFromEuler(euler);
            const q2 = new THREE.Quaternion();
            q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);

            camera.quaternion.multiplyQuaternions(q1, q2);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [camera]);

    return null;
};

// --- Modal de Información Cultural ---
const InfoModal = ({ data, onClose }) => {
    if (!data) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-4 pb-24 sm:pb-4">
            <div className="bg-jaguar-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md pointer-events-auto transform transition-all shadow-2xl shadow-black/50 overflow-y-auto max-h-[80vh]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{data.name}</h2>
                        <p className="text-emerald-400 text-sm font-medium mt-1">{data.short_description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {data.mythology && (
                    <div className="space-y-4">
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <h3 className="text-lg font-serif text-amber-200 mb-2 flex items-center gap-2">
                                <BookOpen size={16} />
                                {data.mythology.title}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {data.mythology.content}
                            </p>
                        </div>

                        {data.mythology.source && (
                            <div className="text-xs text-gray-500 flex justify-between items-center px-1">
                                <span>Fuente: {data.mythology.source}</span>
                                {data.mythology.source_url && (
                                    <a href={data.mythology.source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                                        Ver original
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App ---

export default function AstroAR({ onClose }) {
    const [started, setStarted] = useState(false);
    const [location, setLocation] = useState(null);
    const [date, setDate] = useState(new Date());
    const [selectedConstellation, setSelectedConstellation] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, elevation: pos.coords.altitude || 0 }),
            (err) => { console.error(err); setLocation({ lat: -1.5, lon: -78.0, elevation: 900 }); }
        );
    }, []);

    const handleStart = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') setStarted(true);
                else alert("Permisos requeridos");
            } catch (e) { setStarted(true); }
        } else {
            setStarted(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden">
            <CameraFeed />

            <div className="absolute inset-0 z-10">
                <Canvas onClick={() => setSelectedConstellation(null)}>
                    <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
                    <ambientLight intensity={0.5} />

                    {started && <DeviceOrientationControls />}

                    <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

                    {location && (
                        <group>
                            <RealStars location={location} date={date} />
                            {shuarConstellations.map((constellation, i) => (
                                <Constellation
                                    key={i}
                                    data={constellation}
                                    location={location}
                                    date={date}
                                    onSelect={setSelectedConstellation}
                                />
                            ))}

                            {/* Símbolos Cósmicos Flotantes */}
                            {cosmicSymbols.map((symbol, i) => (
                                <CosmicSymbol
                                    key={`sym-${i}`}
                                    data={symbol}
                                    onClick={setSelectedConstellation}
                                />
                            ))}
                        </group>
                    )}
                </Canvas>
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
                <div className="flex justify-between items-start pointer-events-auto">
                    <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20">
                        <ChevronLeft size={24} />
                    </button>

                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <span className="text-emerald-400 font-bold tracking-wider text-sm flex items-center gap-2">
                            <Compass size={16} />
                            AR ASTRONÓMICO
                        </span>
                    </div>
                </div>

                {/* Start Overlay */}
                {!started && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
                        <div className="text-center p-6 bg-gray-900/90 border border-emerald-500/30 rounded-2xl max-w-sm mx-4 shadow-2xl shadow-emerald-900/20">
                            <h2 className="text-2xl font-bold text-white mb-2">Cosmovisión Shuar</h2>
                            <p className="text-gray-300 mb-6">Descubre las historias ancestrales escritas en las estrellas.</p>
                            <button onClick={handleStart} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/20">
                                Iniciar Viaje
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Footer (Hidden if modal open) */}
                {!selectedConstellation && (
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-20 pointer-events-auto self-center w-full max-w-md transition-all">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <Info size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-medium text-sm">Explora el cielo</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Gira tu dispositivo. Toca las constelaciones para leer sus mitos.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cultural Info Modal */}
            <InfoModal
                data={selectedConstellation}
                onClose={() => setSelectedConstellation(null)}
            />
        </div>
    );
}
