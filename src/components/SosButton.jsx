import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SosOverlay from './SosOverlay';

/**
 * SosButton
 * A floating panic button that stays accessible for the thumb.
 */
const SosButton = ({ nearbyProviders = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-32 right-6 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse active:scale-90 transition-all border-4 border-white/20"
                aria-label="Botón de S.O.S."
            >
                <AlertTriangle size={32} />
                <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">SOS</span>
            </button>

            {isOpen && (
                <SosOverlay
                    onClose={() => setIsOpen(false)}
                    nearbyProviders={nearbyProviders}
                />
            )}
        </>
    );
};

export default SosButton;
