import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Package,
    Clock, Plus, Minus, ShoppingBag, Users
} from 'lucide-react';

const InventoryModule = ({ type, data, onUpdate }) => {
    const [inventory, setInventory] = useState(data);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        checkInventoryLevels();
    }, [inventory]);

    const checkInventoryLevels = () => {
        if (type === 'artisan' && inventory.stock <= 1) {
            setAlert({
                message: "¡Es hora de crear más! Tu stock es crítico.",
                type: 'warning'
            });
        } else if (type === 'guide' && inventory.slots === 0) {
            setAlert({
                message: "Cupos agotados. Evita el overbooking.",
                type: 'danger'
            });
        } else {
            setAlert(null);
        }
    };

    const handleQuickUpdate = (increment) => {
        const newValue = type === 'artisan'
            ? Math.max(0, inventory.stock + increment)
            : Math.max(0, inventory.slots + increment);

        const updated = type === 'artisan'
            ? { ...inventory, stock: newValue }
            : { ...inventory, slots: newValue };

        setInventory(updated);
        onUpdate(updated);
    };

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-inner overflow-hidden relative">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 ${type === 'artisan' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-1">
                        {type === 'artisan' ? 'Piezas en Taller' : 'Asientos Libres'}
                    </h5>
                    <p className="text-xl font-black text-white italic lowercase tracking-tight leading-none">
                        {type === 'artisan' ? 'Artífice Shuar' : 'Guía Jaguar'}
                    </p>
                </div>
                <div className={`p-4 rounded-3xl ${type === 'artisan' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {type === 'artisan' ? <ShoppingBag size={24} /> : <Users size={24} />}
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                        {type === 'artisan' ? inventory.stock : (inventory.slots || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                        {type === 'artisan' ? 'Disponibles' : 'Disponibles'}
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleQuickUpdate(1)}
                        className="bg-white/10 hover:bg-white/20 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-white/10 active:scale-90 shadow-xl"
                        title="Aumentar"
                    >
                        <Plus size={24} />
                    </button>
                    <button
                        onClick={() => handleQuickUpdate(-1)}
                        className="bg-slate-800/80 hover:bg-slate-700 text-slate-400 w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-slate-700 active:scale-90 shadow-xl"
                        title="Disminuir"
                    >
                        <Minus size={24} />
                    </button>
                </div>
            </div>

            {alert ? (
                <div className={`flex items-center gap-4 p-5 rounded-3xl animate-in slide-in-from-bottom-2 duration-500 ${alert.type === 'warning' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'
                    }`}>
                    <AlertTriangle size={24} className="shrink-0" />
                    <p className="text-xs font-black uppercase leading-tight tracking-tight">{alert.message}</p>
                </div>
            ) : (
                <div className="flex items-center gap-4 p-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-3xl animate-in slide-in-from-bottom-2 duration-500">
                    <CheckCircle size={24} className="shrink-0" />
                    <p className="text-xs font-black uppercase leading-tight tracking-tight">¡Todo en orden!</p>
                </div>
            )}
        </div>
    );
};

export default InventoryModule;
