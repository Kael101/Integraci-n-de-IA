import React, { useState, useEffect } from 'react';
import SplashScreen from './components/ui/SplashScreen';
import BottomNav from './components/layout/BottomNav';
import MapCanvas from './components/MapCanvas';
import FloatingSOSButton from './components/layout/FloatingSOSButton';

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simular carga de recursos (imágenes, mapas, datos offline)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // 3 segundos de Branding puro

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {/* Si está cargando, mostramos la Splash. Si no, la App */}
            {isLoading ? (
                <SplashScreen />
            ) : (
                <main className="relative min-h-screen bg-jaguar-950 overflow-hidden font-body">
                    {/* El Mapa ocupa todo el fondo de la pantalla */}
                    <div className="absolute inset-0 z-0">
                        <MapCanvas />
                    </div>

                    {/* HUD de Seguridad (SOS) */}
                    <FloatingSOSButton />

                    {/* Navegación Flotante */}
                    <BottomNav />
                </main>
            )}
        </>
    );
}

export default App;

