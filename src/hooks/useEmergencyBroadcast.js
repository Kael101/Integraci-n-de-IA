import { useState, useCallback } from 'react';

/**
 * useEmergencyBroadcast
 * 
 * Hook to handle emergency communication logic.
 * Captures GPS, Battery, and triggers native SMS fallback.
 */
const useEmergencyBroadcast = () => {
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [error, setError] = useState(null);

    const broadcastEmergency = useCallback(async (userName = 'Turista', nearbyProviders = []) => {
        setIsBroadcasting(true);
        setError(null);

        try {
            // 1. Obtener Batería
            let batteryLevel = 'N/A';
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                batteryLevel = `${Math.round(battery.level * 100)}%`;
            }

            // 2. Obtener Historial de Trayectoria (Breadcrumbs)
            const history = JSON.parse(localStorage.getItem('jaguar_movement_history') || '[]');
            const trajectoryInfo = history.length > 0
                ? `\nTrayectoria últimas 3h: ${history.length} puntos registrados.`
                : '';

            // 3. Geocalización (Alta Precisión)
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

                    // 4. Identificar Contactos Comunitarios (Proveedores a < 1km)
                    let communityContacts = "";
                    if (nearbyProviders.length > 0) {
                        // Simular obtención de teléfonos de los proveedores cercanos
                        const neighbors = nearbyProviders
                            .slice(0, 2)
                            .map(p => `${p.properties.name} (Cerca)`)
                            .join(", ");
                        communityContacts = `\nComonidad cercana: ${neighbors}`;
                    }

                    // 5. Construir Mensaje
                    const message = `SOS JAGUAR: ${userName} necesita ayuda urgente.\nUbicación: ${mapsLink}\nBatería: ${batteryLevel}${trajectoryInfo}${communityContacts}`;

                    // 6. Números de Emergencia (General + Comunitarios si existen)
                    // En un caso real, concatenaríamos teléfonos reales de los proveedores
                    const emergencyNumbers = "911,+593XXXXXXXXX";
                    const smsUri = `sms:${emergencyNumbers}?body=${encodeURIComponent(message)}`;

                    window.location.href = smsUri;
                    setIsBroadcasting(false);
                },
                (err) => {
                    setError('GPS falló.');
                    setIsBroadcasting(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (err) {
            setError('Error crítico.');
            setIsBroadcasting(false);
        }
    }, []);

    return { broadcastEmergency, isBroadcasting, error };
};

export default useEmergencyBroadcast;
