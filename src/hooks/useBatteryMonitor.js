// src/hooks/useBatteryMonitor.js
import { useState, useEffect } from 'react';
import { useAdaptivePowerMode } from './useAdaptivePowerMode';


/**
 * HOOK: MONITOR DE BATERÍA
 * Detecta nivel de energía para activar "Modo Ahorro Jaguar"
 */
const useBatteryMonitor = () => {
    // Delegar toda la lógica al hook avanzado
    const adaptive = useAdaptivePowerMode();
    return {
        batteryLevel: adaptive.batteryLevel,
        isLowPower: adaptive.isLowPower,
        isCharging: adaptive.isCharging,
        // Nuevas propiedades del sistema adaptivo (retro-compatible: solo añade)
        powerTier: adaptive.powerTier,
        gpsInterval: adaptive.gpsInterval,
        allowSync: adaptive.allowSync,
        estimatedSavings: adaptive.estimatedSavings,
        tierConfig: adaptive.tierConfig,
    };
};

export default useBatteryMonitor;
