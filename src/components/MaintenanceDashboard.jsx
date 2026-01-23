import React, { useState } from 'react';
import {
    Activity, Shield, Users, Brain, Zap,
    Settings, HardDrive, AlertTriangle, CheckCircle,
    BarChart3, Map as MapIcon, Clock, Tool
} from 'lucide-react';

const MaintenanceDashboard = () => {
    const [activeTab, setActiveTab] = useState('kernel');

    const modules = [
        { id: 'kernel', name: 'Núcleo', icon: <HardDrive size={20} />, description: 'Gestión de Activos e Inventario' },
        { id: 'shield', name: 'Escudo', icon: <Shield size={20} />, description: 'Mantenimiento Preventivo y CBM' },
        { id: 'human', name: 'Capital Humano', icon: <Users size={20} />, description: 'Capacitación y Seguridad' },
        { id: 'brain', name: 'Cerebro', icon: <Activity size={20} />, description: 'Análisis de Datos y KPIs' },
        { id: 'evolution', name: 'Evolución', icon: <Zap size={20} />, description: 'Mejora Continua y Feedback' }
    ];

    const kpis = [
        { label: 'MTBF', value: '742h', trend: '+12%', color: 'text-emerald-400' },
        { label: 'MTTR', value: '4.2h', trend: '-8%', color: 'text-blue-400' },
        { label: 'HCI (Health)', value: '94%', trend: 'Estable', color: 'text-yellow-400' },
        { label: 'PAD (IA Accuracy)', value: '98.2%', trend: '+2.4%', color: 'text-purple-400' }
    ];

    const assets = [
        { id: 'S-UPANO-01', name: 'Sensor Nivel Río Upano', status: 'Healthy', battery: '88%', lastMaint: '2 días' },
        { id: 'D-DRONE-04', name: 'Drone Vigilancia Jaguar', status: 'Warning', battery: '24%', lastMaint: '5 días' },
        { id: 'R-MESH-09', name: 'Repetidor Malla Selva', status: 'Healthy', battery: '92%', lastMaint: '12 días' },
        { id: 'S-BIO-22', name: 'Cámara Trampa IA', status: 'Maintenance', battery: '0%', lastMaint: 'Hoy' }
    ];

    const renderKernel = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <MapIcon size={18} className="text-emerald-400" /> Distribución Geográfica de Activos
                    </h4>
                    <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700/30 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <p className="text-slate-500 text-sm font-mono tracking-tighter">[ CARGANDO MAPA SATELITAL MS-CORE ]</p>
                    </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" /> Estado de Inventario
                    </h4>
                    <div className="space-y-3">
                        {assets.map(asset => (
                            <div key={asset.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/20 flex justify-between items-center group hover:border-emerald-500/30 transition-colors">
                                <div>
                                    <p className="text-xs font-mono text-slate-500 mb-0.5">{asset.id}</p>
                                    <p className="text-sm font-bold text-slate-200">{asset.name}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${asset.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                                            asset.status === 'Warning' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-red-500/10 text-red-400'
                                        }`}>
                                        {asset.status}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Batería: {asset.battery}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBrain = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{kpi.label}</p>
                        <h4 className={`text-3xl font-black ${kpi.color} tracking-tighter`}>{kpi.value}</h4>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`text-[10px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{kpi.trend}</span>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">vs mes pasado</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 backdrop-blur-md">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h4 className="text-2xl font-black text-white tracking-tight">Estabilidad del Ecosistema (MTBF)</h4>
                        <p className="text-sm text-slate-400">Análisis predictivo de fallas mediante IA</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-700">7D</button>
                        <button className="bg-emerald-600 px-4 py-2 rounded-xl text-[10px] font-bold text-white shadow-lg shadow-emerald-900/20">30D</button>
                    </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {[65, 78, 45, 89, 92, 76, 82, 88, 95, 84, 72, 98].map((val, i) => (
                        <div key={i} className="flex-1 bg-slate-700/30 rounded-t-lg relative group">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-1000 group-hover:brightness-125"
                                style={{ height: `${val}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {val}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">
                    <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 bg-[#0b0f19] min-h-screen text-slate-300 font-sans selection:bg-emerald-500/30">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-900/40">
                            <Settings size={28} className="animate-spin-slow" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">SGMA <span className="text-emerald-500">v1.0</span></h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Gestión de Activos Inteligente · Morona Santiago</p>
                </div>

                <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                    {modules.map(mod => (
                        <button
                            key={mod.id}
                            onClick={() => setActiveTab(mod.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === mod.id
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 shadow-inner'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            {mod.icon}
                            <span className="text-xs font-black uppercase tracking-widest hidden lg:block">{mod.name}</span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="mb-10 p-8 border-l-4 border-emerald-500 bg-emerald-500/5 rounded-r-[2.5rem]">
                    <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{modules.find(m => m.id === activeTab).name}</h3>
                    <p className="text-slate-400 font-medium italic">{modules.find(m => m.id === activeTab).description}</p>
                </div>

                {activeTab === 'kernel' && renderKernel()}
                {activeTab === 'brain' && renderBrain()}

                {['shield', 'human', 'evolution'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-800/20 border border-dashed border-slate-700 rounded-[3rem]">
                        <div className="bg-slate-900 p-6 rounded-full mb-6 text-slate-600">
                            <AlertTriangle size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Módulo en Despliegue</h3>
                        <p className="text-slate-500 max-w-md mx-auto font-medium">
                            La IA está procesando los protocolos de {modules.find(m => m.id === activeTab).name.toLowerCase()}.
                            Disponibilidad estimada: 48 horas.
                        </p>
                        <button className="mt-8 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] border border-slate-700 shadow-xl transition-all">
                            Priorizar Carga
                        </button>
                    </div>
                )}
            </main>

            {/* Alertas Flotantes / Logs */}
            <div className="fixed bottom-8 left-8 max-w-xs space-y-3 z-30">
                <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-in slide-in-from-left-full duration-700">
                    <div className="flex items-center gap-3 text-emerald-400 mb-1">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronización OK</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Sensores en cascada S-UPANO operando bajo parámetros normales.</p>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceDashboard;
