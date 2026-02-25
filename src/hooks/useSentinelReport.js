import { useState, useRef, useCallback } from 'react';
import { saveReport } from '../services/sentinelReportService';

/**
 * useSentinelReport
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook orquestador del flujo "Centinela del Jaguar".
 * Gestiona: paso actual, captura de imagen, GPS, brújula, cifrado y guardado.
 *
 * Pasos del flujo:
 *   'legal'    → aviso de anonimato
 *   'camera'   → captura con cámara
 *   'category' → elección de categoría
 *   'confirm'  → confirmación y envío
 *   'success'  → éxito + XP
 *   'hidden'   → protocolo de pánico activado
 */
export const useSentinelReport = () => {
    const [step, setStep] = useState('legal');
    const [capturedImage, setCapturedImage] = useState(null); // data URL (base64)
    const [location, setLocation] = useState(null);           // { lat, lng }
    const [heading, setHeading] = useState(null);             // grados (0-360)
    const [category, setCategory] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedReport, setSavedReport] = useState(null);
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // ─── Geolocalización ───────────────────────────────────────────────────────

    const getLocation = useCallback(() => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ lat: -2.3, lng: -78.1 }); // fallback Morona Santiago
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve({ lat: -2.3, lng: -78.1 }),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    }, []);

    // ─── Brújula ──────────────────────────────────────────────────────────────

    const captureHeading = useCallback(() => {
        return new Promise((resolve) => {
            const handler = (e) => {
                window.removeEventListener('deviceorientationabsolute', handler);
                window.removeEventListener('deviceorientation', handler);
                resolve(Math.round(e.alpha) || 0);
            };
            if ('DeviceOrientationEvent' in window) {
                window.addEventListener('deviceorientationabsolute', handler, { once: true });
                window.addEventListener('deviceorientation', handler, { once: true });
                setTimeout(() => resolve(0), 1500); // timeout fallback
            } else {
                resolve(0);
            }
        });
    }, []);

    // ─── Cámara ───────────────────────────────────────────────────────────────

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // Capturar GPS y brújula en paralelo mientras la cámara arranca
            const [loc, hdg] = await Promise.all([getLocation(), captureHeading()]);
            setLocation(loc);
            setHeading(hdg);
        } catch (err) {
            console.error('[Sentinel] Error abriendo cámara:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }, [getLocation, captureHeading]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    /**
     * Captura el frame actual del video y embebe metadatos en el canvas.
     * Los metadatos (GPS, timestamp, heading) se estampan en una esquina
     * del canvas en font-size pequeño, visible para el usuario como HUD
     * del reporte técnico.
     */
    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video) return null;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');

        // Dibujar frame de video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Estampar metadatos (técnicos, en esquina inferior izquierda)
        const ts = new Date().toISOString();
        const lat = location?.lat?.toFixed(6) ?? '???';
        const lng = location?.lng?.toFixed(6) ?? '???';
        const hdg = heading ?? 0;

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, canvas.height - 58, 380, 58);
        ctx.fillStyle = '#00FF88';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`📍 ${lat}, ${lng}`, 10, canvas.height - 38);
        ctx.fillText(`🧭 ${hdg}° | 🕐 ${ts.replace('T', ' ').slice(0, 19)} UTC`, 10, canvas.height - 18);

        stopCamera();
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(imageBase64);
        setStep('category');
        return imageBase64;
    }, [location, heading, stopCamera]);

    // ─── Flujo de Pasos ───────────────────────────────────────────────────────

    const acceptLegal = useCallback(() => setStep('camera'), []);

    const selectCategory = useCallback((cat) => {
        setCategory(cat);
        setStep('confirm');
    }, []);

    const submitReport = useCallback(async () => {
        if (!capturedImage || !category) return;
        setIsSaving(true);
        setError(null);

        try {
            const report = await saveReport({
                imageBase64: capturedImage,
                category,
                location: location || { lat: -2.3, lng: -78.1 },
                heading: heading || 0,
                timestamp: new Date().toISOString()
            });
            setSavedReport(report);
            setStep('success');
        } catch (err) {
            console.error('[Sentinel] Error guardando reporte:', err);
            setError('Error al guardar el reporte. Inténtalo de nuevo.');
        } finally {
            setIsSaving(false);
        }
    }, [capturedImage, category, location, heading]);

    const resetFlow = useCallback(() => {
        stopCamera();
        setStep('legal');
        setCapturedImage(null);
        setLocation(null);
        setHeading(null);
        setCategory(null);
        setIsSaving(false);
        setSavedReport(null);
        setError(null);
    }, [stopCamera]);

    const activatePanic = useCallback(() => {
        stopCamera();
        setStep('hidden');
        sessionStorage.setItem('sentinel_panic', 'true');
    }, [stopCamera]);

    const isPanicActive = sessionStorage.getItem('sentinel_panic') === 'true';

    return {
        // Estado
        step,
        capturedImage,
        location,
        heading,
        category,
        isSaving,
        savedReport,
        error,
        videoRef,
        isPanicActive,
        // Acciones
        acceptLegal,
        startCamera,
        stopCamera,
        captureFrame,
        selectCategory,
        submitReport,
        resetFlow,
        activatePanic
    };
};

export default useSentinelReport;
