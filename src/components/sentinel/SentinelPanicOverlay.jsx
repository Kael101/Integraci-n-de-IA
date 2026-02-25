import React, { useEffect, useRef, useCallback } from 'react';

/**
 * SentinelPanicOverlay
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper invisible que detecta 3 clicks/taps rápidos (≤ 800ms) en cualquier
 * parte de la pantalla y activa el protocolo de pánico, cerrando
 * INSTANTÁNEAMENTE toda la UI del módulo Centinela (sin animación).
 *
 * Si el módulo está oculto por pánico, muestra una pantalla completamente
 * neutra (negra) sin rastro de la interfaz de alertas.
 */
const SentinelPanicOverlay = ({ children, onPanic, isPanicActive }) => {
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef(null);

    const handleTap = useCallback((e) => {
        // Solo contar taps en la zona segura (no en botones de UI normal)
        tapCountRef.current += 1;

        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0;
        }, 800);

        if (tapCountRef.current >= 3) {
            tapCountRef.current = 0;
            clearTimeout(tapTimerRef.current);
            onPanic?.();
        }
    }, [onPanic]);

    useEffect(() => {
        return () => clearTimeout(tapTimerRef.current);
    }, []);

    if (isPanicActive) {
        // Pantalla completamente neutra — sin rastro del módulo
        return (
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    backgroundColor: '#000', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}
            >
                {/* Pantalla negra neutra — sin texto ni indicadores */}
            </div>
        );
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'none' }}
            onClick={handleTap}
        >
            {/* Los children renderizan de forma normal */}
            <div style={{ pointerEvents: 'auto' }}>
                {children}
            </div>
        </div>
    );
};

export default SentinelPanicOverlay;
