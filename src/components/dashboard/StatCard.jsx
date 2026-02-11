import React from 'react';

const StatCard = ({ title, value, growth, isAlert = false }) => (
    <div className={`p-6 rounded-xl border ${isAlert ? 'border-red-500 bg-red-50/10' : 'border-white/10 bg-[#0D211A]'} backdrop-blur-md`}>
        <h3 className="text-[#F8F9FA] text-xs font-bold uppercase tracking-widest mb-2 opacity-70">
            {title}
        </h3>
        <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-[#C5A059]">{value}</p>
            {growth && (
                <span className="text-green-400 text-xs font-medium">
                    +{growth}%
                </span>
            )}
        </div>
    </div>
);

export default StatCard;
