import React from 'react';

/**
 * JIcon
 * Wrapper component to ensure all icons follow the "Territorio Jaguar" tactical aesthetic.
 * 
 * Stroke Width: 1.5 (Elegant and precise)
 * Variants: primary (gold glow), secondary (soft white), danger (red), tech (cyan)
 */
const JIcon = ({ icon: Icon, variant = 'primary', className = '', size = 24, ...props }) => {

    // Custom color variants for the Jaguar brand
    const variants = {
        primary: 'text-jaguar-500 drop-shadow-[0_0_8px_rgba(197,160,89,0.3)]', // Dorado with Glow suave
        secondary: 'text-white/80', // Blanco discreto para UI
        danger: 'text-red-500', // Alertas
        tech: 'text-cyan-400', // Para momentos muy "data"
    };

    if (!Icon) return null;

    return (
        <Icon
            size={size}
            strokeWidth={1.5} // High-precision tactical look
            className={`transition-all duration-300 ${variants[variant] || ''} ${className}`}
            {...props}
        />
    );
};

export default JIcon;
