import { useState, useEffect } from 'react';

/**
 * Hook de Gamificación
 * Maneja el progreso del usuario (XP, Nivel, Sellos).
 */
export const useGamification = () => {
    const [currentXP, setCurrentXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [unlockedStamps, setUnlockedStamps] = useState([]);
    const [justLeveledUp, setJustLeveledUp] = useState(false);

    // Cargar progreso al iniciar
    useEffect(() => {
        const savedProgress = JSON.parse(localStorage.getItem('passport_progress') || '{}');
        if (savedProgress) {
            setCurrentXP(savedProgress.xp || 0);
            setLevel(savedProgress.level || 1);
            setUnlockedStamps(savedProgress.stamps || []);
        }
    }, []);

    // Guardar progreso cuando cambia
    useEffect(() => {
        localStorage.setItem('passport_progress', JSON.stringify({
            xp: currentXP,
            level: level,
            stamps: unlockedStamps
        }));
    }, [currentXP, level, unlockedStamps]);

    /**
     * Calcula la XP necesaria para el siguiente nivel
     * Fórmula Exponencial: 100 * (Nivel ^ 1.5)
     */
    const getXPForNextLevel = (currentLevel) => {
        return Math.floor(100 * Math.pow(currentLevel, 1.5));
    };

    /**
     * Añade XP y verifica subida de nivel
     */
    const addXP = (amount) => {
        let newXP = currentXP + amount;
        let newLevel = level;
        let needed = getXPForNextLevel(newLevel);

        // Loop para subir múltiples niveles si la XP es mucha
        while (newXP >= needed) {
            newXP -= needed;
            newLevel++;
            needed = getXPForNextLevel(newLevel);
            setJustLeveledUp(true);
        }

        setCurrentXP(newXP);
        setLevel(newLevel);
    };

    /**
     * Desbloquea un sello
     */
    const unlockStamp = (poiId, xpValue, routeId) => {
        if (unlockedStamps.includes(poiId)) return false; // Ya desbloqueado

        // Lógica de Bono por Ruta Larga (Ejemplo)
        let finalXP = xpValue;
        if (routeId === 'RUTA_PANORAMICA') { // Ejemplo de bono
            finalXP = Math.round(xpValue * 1.5);
        }

        setUnlockedStamps(prev => [...prev, poiId]);
        addXP(finalXP);
        return { success: true, xpGained: finalXP };
    };

    const resetLevelUpFlag = () => setJustLeveledUp(false);

    return {
        currentXP,
        level,
        unlockedStamps,
        xpToNext: getXPForNextLevel(level) - currentXP,
        progressPercent: (currentXP / getXPForNextLevel(level)) * 100,
        addXP,
        unlockStamp,
        justLeveledUp,
        resetLevelUpFlag
    };
};
