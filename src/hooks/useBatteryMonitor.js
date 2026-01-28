// src/hooks/useBatteryMonitor.js
import { useState, useEffect } from 'react';

/**
 * HOOK: MONITOR DE BATERÍA
 * Detecta nivel de energía para activar "Modo Ahorro Jaguar"
 */
const useBatteryMonitor = () => {
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [isLowPower, setIsLowPower] = useState(false);
    const [isCharging, setIsCharging] = useState(false);

    useEffect(() => {
        let batteryInfo = null;

        const updateBattery = () => {
            if (batteryInfo) {
                const level = Math.floor(batteryInfo.level * 100);
                setBatteryLevel(level);
                setIsCharging(batteryInfo.charging);

                // Activar modo ahorro si < 20% y no está cargando
                setIsLowPower(level <= 20 && !batteryInfo.charging);
            }
        };

        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                batteryInfo = battery;
                updateBattery();

                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            });
        }

        return () => {
            if (batteryInfo) {
                batteryInfo.removeEventListener('levelchange', updateBattery);
                batteryInfo.removeEventListener('chargingchange', updateBattery);
            }
        };
    }, []);

    return { batteryLevel, isLowPower, isCharging };
};

export default useBatteryMonitor;
