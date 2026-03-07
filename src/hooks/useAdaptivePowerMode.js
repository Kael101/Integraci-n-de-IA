// src/hooks/useAdaptivePowerMode.js
import { useState, useEffect, useCallback } from 'react';

/**
 * ADAPTIVE POWER MODE — 4 Niveles de Energía
 * Territorio Jaguar · Battery Intelligence Layer
 * ================================================
 * Reemplaza la lógica binaria (normal/low) de useBatteryMonitor.js
 * con 4 niveles adaptativos que determinan el comportamiento de GPS,
 * sincronización y UI a lo largo de toda la app.
 *
 * NIVELES:
 *  TURBO      → >80% + cargando: GPS 500ms, sync activa, full features
 *  NORMAL     → 20-80%: GPS 2000ms, sync normal, full features
 *  ECO        → 10-20%: GPS 8000ms, solo offline reads, UI simplificada
 *  DEEP_SLEEP → <10%: GPS 30000ms, solo emergencias, no sync
 *
 * BATTERY SAVINGS ESTIMATE:
 *  vs baseline (siempre TURBO):
 *  NORMAL  → ~8%   ahorro
 *  ECO     → ~22%  ahorro
 *  DEEP_SLEEP → ~40% ahorro
 */

export const POWER_TIERS = {
    TURBO: 'TURBO',
    NORMAL: 'NORMAL',
    ECO: 'ECO',
    DEEP_SLEEP: 'DEEP_SLEEP',
};

/** Intervalos de GPS en ms por tier */
export const GPS_INTERVALS = {
    [POWER_TIERS.TURBO]: 500,
    [POWER_TIERS.NORMAL]: 2000,
    [POWER_TIERS.ECO]: 8000,
    [POWER_TIERS.DEEP_SLEEP]: 30000,
};

/** Ahorro estimado de batería vs baseline (%) */
export const BATTERY_SAVINGS_ESTIMATE = {
    [POWER_TIERS.TURBO]: 0,
    [POWER_TIERS.NORMAL]: 8,
    [POWER_TIERS.ECO]: 22,
    [POWER_TIERS.DEEP_SLEEP]: 40,
};

/** Descriptor visual por tier */
export const TIER_CONFIG = {
    [POWER_TIERS.TURBO]: {
        label: 'Turbo',
        color: '#00B4D8',
        bgColor: 'rgba(0,180,216,0.15)',
        icon: '⚡',
        description: 'Todas las funciones activas',
    },
    [POWER_TIERS.NORMAL]: {
        label: 'Normal',
        color: '#40916C',
        bgColor: 'rgba(64,145,108,0.15)',
        icon: '🌿',
        description: 'Modo estándar',
    },
    [POWER_TIERS.ECO]: {
        label: 'ECO',
        color: '#FFB703',
        bgColor: 'rgba(255,183,3,0.15)',
        icon: '🌙',
        description: 'Ahorro activo · Solo offline',
    },
    [POWER_TIERS.DEEP_SLEEP]: {
        label: 'Deep Sleep',
        color: '#E63946',
        bgColor: 'rgba(230,57,70,0.15)',
        icon: '🔴',
        description: 'Crítico · Solo emergencias',
    },
};

/**
 * Determina el tier desde nivel de batería y estado de carga.
 */
function computeTier(level, charging) {
    if (charging && level > 80) return POWER_TIERS.TURBO;
    if (level > 20) return POWER_TIERS.NORMAL;
    if (level > 10) return POWER_TIERS.ECO;
    return POWER_TIERS.DEEP_SLEEP;
}

/**
 * useAdaptivePowerMode
 *
 * @returns {{
 *   powerTier: string,
 *   batteryLevel: number,
 *   isCharging: boolean,
 *   gpsInterval: number,
 *   isLowPower: boolean,         // retro-compatible con useBatteryMonitor
 *   allowSync: boolean,          // false en ECO/DEEP_SLEEP
 *   allowHighAccuracyGPS: boolean,
 *   estimatedSavings: number,    // % ahorro estimado vs baseline
 *   tierConfig: object,          // metadatos visuales del tier actual
 * }}
 */
export function useAdaptivePowerMode() {
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [isCharging, setIsCharging] = useState(false);
    const [powerTier, setPowerTier] = useState(POWER_TIERS.NORMAL);

    const updateTier = useCallback((level, charging) => {
        const newTier = computeTier(level, charging);
        setPowerTier(newTier);
        setBatteryLevel(level);
        setIsCharging(charging);
    }, []);

    useEffect(() => {
        let batteryRef = null;

        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                batteryRef = battery;

                const sync = () => {
                    const level = Math.floor(battery.level * 100);
                    updateTier(level, battery.charging);
                };

                sync(); // Leer estado actual
                battery.addEventListener('levelchange', sync);
                battery.addEventListener('chargingchange', sync);
            }).catch(() => {
                // Battery API no disponible (Firefox, algunos Android) → asumir NORMAL
                setPowerTier(POWER_TIERS.NORMAL);
            });
        } else {
            // Asumir NORMAL si no hay Battery API
            setPowerTier(POWER_TIERS.NORMAL);
        }

        return () => {
            if (batteryRef) {
                batteryRef.removeEventListener('levelchange', () => { });
                batteryRef.removeEventListener('chargingchange', () => { });
            }
        };
    }, [updateTier]);

    const gpsInterval = GPS_INTERVALS[powerTier];
    const isLowPower = powerTier === POWER_TIERS.ECO || powerTier === POWER_TIERS.DEEP_SLEEP;
    const allowSync = powerTier === POWER_TIERS.TURBO || powerTier === POWER_TIERS.NORMAL;
    const allowHighAccuracyGPS = powerTier === POWER_TIERS.TURBO || powerTier === POWER_TIERS.NORMAL;
    const estimatedSavings = BATTERY_SAVINGS_ESTIMATE[powerTier];
    const tierConfig = TIER_CONFIG[powerTier];

    // Log de transición de tier
    useEffect(() => {
        console.log(`[AdaptivePower] Tier → ${powerTier} | GPS: ${gpsInterval}ms | Sync: ${allowSync} | Savings: ~${estimatedSavings}%`);
    }, [powerTier]);

    return {
        powerTier,
        batteryLevel,
        isCharging,
        gpsInterval,
        isLowPower,         // retro-compatible
        allowSync,
        allowHighAccuracyGPS,
        estimatedSavings,
        tierConfig,
    };
}

export default useAdaptivePowerMode;
