import React, { useState, useEffect } from 'react';
import { WifiOff, Leaf } from 'lucide-react';

const JaguarModeNotification = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-jaguar-900 to-black border-b border-amber-500/50 p-3 shadow-lg animate-slide-down">
            <div className="container mx-auto flex items-center justify-center gap-3 text-amber-500">
                <WifiOff className="animate-pulse" size={20} />
                <div className="text-sm font-medium flex items-center gap-2">
                    <span>Modo Jaguar Activado: Sin conexión.</span>
                    <span className="hidden md:inline px-2 py-0.5 bg-amber-500/20 rounded-full text-xs border border-amber-500/30 flex items-center gap-1">
                        <Leaf size={10} /> Jungle Protein recomendado
                    </span>
                </div>
            </div>
        </div>
    );
};

export default JaguarModeNotification;
