// src/components/ui/UpanoIcon.jsx
import React from 'react';

const UpanoIcon = ({ size = 24, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-[0_0_5px_rgba(197,160,89,0.8)] ${className}`}
    >
        {/* Marco de la Tola */}
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#C5A059" strokeWidth="1.5" />

        {/* Caminos Ancestrales */}
        <path d="M12 3V21" stroke="#C5A059" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M3 12H21" stroke="#C5A059" strokeWidth="1" strokeDasharray="2 2" />

        {/* Núcleo de la Ciudad (El Jaguar) */}
        <rect x="9" y="9" width="6" height="6" fill="#C5A059" />
        <circle cx="12" cy="12" r="1.5" fill="#1B3B2F" />
    </svg>
);

export default UpanoIcon;
