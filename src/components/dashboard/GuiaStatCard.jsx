import React from 'react';
import { Shield, Star, Map, User } from 'lucide-react';

const GuiaStatCard = ({ name, status, routesCount, rating }) => {
    const isPremium = status === 'active';

    return (
        <div className="bg-[#1B3B2F] border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-2xl relative overflow-hidden group hover:border-[#C5A059]/50 transition-all">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C5A059]/20 transition-all duration-700"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isPremium ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-gray-700/50 text-gray-400'}`}>
                        {isPremium ? <Shield size={20} /> : <User size={20} />}
                    </div>
                    <div>
                        <h3 className="text-white font-Montserrat font-bold uppercase tracking-wider text-lg">{name}</h3>
                        <p className="text-[#C5A059] text-xs font-medium flex items-center gap-1">
                            {isPremium ? '🐆 JAGUAR VERIFICADO' : 'Explorador Básico'}
                        </p>
                    </div>
                </div>
                <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] ${isPremium ? 'text-green-500 bg-green-500 animate-pulse' : 'text-gray-500 bg-gray-500'}`} />
            </div>

            <div className="mt-6 flex justify-between items-end relative z-10">
                <div className="space-y-1">
                    <p className="text-[#F8F9FA]/60 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Map size={12} /> Rutas Publicadas
                    </p>
                    <p className="text-white text-2xl font-black font-Inter">{routesCount}</p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[#F8F9FA]/60 text-[10px] uppercase tracking-wider flex items-center justify-end gap-1">
                        <Star size={12} /> Rating
                    </p>
                    <p className="text-[#C5A059] text-xl font-bold font-Inter flex items-center gap-1 justify-end">
                        {rating} <span className="text-xs text-[#C5A059]/70">/ 5.0</span>
                    </p>
                </div>
            </div>

            <button className={`w-full mt-4 py-2.5 font-bold rounded-lg transition-all duration-300 text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${isPremium
                    ? 'bg-[#C5A059] hover:bg-[#b38f4d] text-[#0D211A]'
                    : 'bg-transparent border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10'
                }`}>
                {isPremium ? 'Ver Dashboard de Guía' : 'Invitar a Afiliación'}
            </button>
        </div>
    );
};

export default GuiaStatCard;
