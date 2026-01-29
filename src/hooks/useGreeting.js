import { useState, useEffect } from 'react';

/**
 * useGreeting Hook
 * Devuelve un saludo dinámico basado en la hora del día.
 * Sigue el patrón de "Separation of Concerns" (SoC).
 */
export const useGreeting = () => {
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return "Buenos días, Guardián. La selva despierta contigo.";
            if (hour >= 12 && hour < 18.5) return "Buenas tardes, Explorador. El sol ilumina los caminos antiguos.";
            return "Buenas noches, Jaguar. El territorio te pertenece.";
        };
        setGreeting(getGreeting());
    }, []);

    return greeting;
};
