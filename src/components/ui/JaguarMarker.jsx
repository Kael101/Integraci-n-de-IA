import React from 'react';

/**
 * JaguarMarker
 * A high-precision tactical marker with a radar pulse (ping) effect.
 * Represents the user's "Jaguar Pulse" on the map.
 */
const JaguarMarker = () => {
    return (
        <div className="relative flex items-center justify-center w-8 h-8">
            {/* 1. Onda expansiva (Ping de Radar) */}
            <div className="absolute w-full h-full bg-jaguar-500 rounded-full opacity-75 animate-radar"></div>

            {/* 2. Halo estático brillante */}
            <div className="absolute w-4 h-4 bg-jaguar-500 rounded-full shadow-[0_0_15px_#C5A059]"></div>

            {/* 3. Núcleo sólido */}
            <div className="relative w-2 h-2 bg-white rounded-full"></div>
        </div>
    );
};

export default JaguarMarker;
