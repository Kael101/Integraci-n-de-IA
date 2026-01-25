import React from 'react';
import { Info } from 'lucide-react';

/**
 * ActionCard
 * A card representing a specific first aid instruction or emergency action.
 */
const ActionCard = ({ item }) => {
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl border-l-[12px] border-red-600">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                item.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                    'bg-slate-100 text-slate-500'
                            }`}>
                            Prioridad: {item.priority}
                        </span>
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tight text-black italic">
                        {item.title}
                    </h4>
                </div>
                <div className="bg-slate-100 p-3 rounded-2xl text-slate-400">
                    <Info size={24} />
                </div>
            </div>

            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contexto Regional</p>
                <p className="text-sm font-bold text-slate-700">{item.details}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Pasos de Emergencia</p>
                    <ul className="space-y-3">
                        {item.panic_mode_steps.map((step, i) => (
                            <li key={i} className="flex gap-4 items-start">
                                <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm font-bold text-slate-800 leading-tight">
                                    {step}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                {item.do_not_do && item.do_not_do.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">⚠️ Lo que NO se debe hacer</p>
                        <ul className="space-y-2">
                            {item.do_not_do.map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="text-red-500 font-bold">✕</span>
                                    <p className="text-xs font-bold text-slate-500">
                                        {step}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionCard;
