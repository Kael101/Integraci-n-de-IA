import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import ActionCard from './ActionCard';

/**
 * FirstAidLibrary
 * Full-screen reader for the offline first aid guide data.
 */
const FirstAidLibrary = ({ data, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const protocols = data.protocols || [];

    const filteredData = protocols
        .filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.panic_mode_steps.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => (a.priority === 'CRITICAL' ? -1 : 1));

    return (
        <div className="fixed inset-0 bg-slate-900 z-[110] flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
            <div className="p-8 bg-slate-900 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Guía de Auxilio</h2>
                    <button onClick={onClose} className="bg-white/10 p-3 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Buscador Rápido */}
                <div className="relative mb-4 text-black">
                    <input
                        type="text"
                        placeholder="Buscar emergencia (ej: serpiente)..."
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 pl-12 text-white placeholder:text-white/40 focus:border-red-500 outline-none transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6">
                {filteredData.map(item => (
                    <ActionCard key={item.id} item={item} />
                ))}
                {filteredData.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-bold">No se encontraron resultados para "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirstAidLibrary;
