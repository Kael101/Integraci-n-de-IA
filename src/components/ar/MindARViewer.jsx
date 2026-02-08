import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const MindARViewer = ({ onClose }) => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState(null);

    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.crossOrigin = "anonymous";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        const initAR = async () => {
            try {
                // Load A-Frame first
                await loadScript('https://aframe.io/releases/1.5.0/aframe.min.js');
                // Load MindAR for A-Frame
                await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js');
                setScriptsLoaded(true);
            } catch (err) {
                console.error("Failed to load AR scripts", err);
                setLoadingError("No se pudo iniciar el motor de Realidad Aumentada.");
            }
        };

        initAR();

        return () => {
            // Cleanup implementation is tricky with global A-Frame.
            // For PoC, we try to stop the video stream to release the camera.
            const video = document.querySelector('video');
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.remove();
            }
            // Also try to remove the scene to prevent memory leaks if possible, though A-Frame is global.
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.parentNode?.removeChild(scene);
            }
        };
    }, []);

    if (loadingError) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white p-4 z-50">{loadingError}</div>;
    if (!scriptsLoaded) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white p-4 z-50">Cargando motor AR...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
            {/* A-Frame Scene */}
            {/* 
                 usando 'dangerouslySetInnerHTML' es un truco común en React para evitar 
                 que el VDOM pelee con A-Frame por el control de los elementos, 
                 pero para este PoC simple, renderizaremos directamente esperando que React 18 lo maneje bien.
                 (Ignorará los custom elements).
             */}
            <a-scene
                mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no;"
                color-space="sRGB"
                embedded
                renderer="colorManagement: true, physicallyCorrectLights"
                vr-mode-ui="enabled: false"
                device-orientation-permission-ui="enabled: false"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <a-assets>
                </a-assets>

                <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                {/* Target 0: El ejemplo default de MindAR (Tarjeta) */}
                <a-entity mindar-image-target="targetIndex: 0">
                    {/* Plane semi-transparente para ver el tracking */}
                    <a-plane color="blue" opacity="0.3" position="0 0 0" height="0.552" width="1" rotation="0 0 0"></a-plane>

                    {/* Cubo animado flotante */}
                    <a-box
                        position="0 0 0.5"
                        scale="0.5 0.5 0.5"
                        color="#DC2626"
                        animation="property: rotation; to: 0 360 0; dur: 2000; loop: true; easing: linear"
                    ></a-box>
                </a-entity>
            </a-scene>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white p-3 rounded-full z-[1000] hover:bg-white/20 transition-colors"
            >
                <X size={24} />
            </button>

            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-[1000]">
                <div className="bg-black/60 inline-block px-6 py-2 rounded-full backdrop-blur-md text-white border border-white/10">
                    <p className="font-bold text-sm">Apunta a la imagen de prueba</p>
                    <p className="text-[10px] text-gray-300">(Tarjeta de Ejemplo MindAR)</p>
                </div>
            </div>
        </div>
    );
};

export default MindARViewer;
