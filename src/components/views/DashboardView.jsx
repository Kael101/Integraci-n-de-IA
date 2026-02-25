import React from 'react';
import StatCard from '../dashboard/StatCard';
import GuiaStatCard from '../dashboard/GuiaStatCard';
import { RefreshCw } from 'lucide-react';

const DashboardView = () => {
    // Datos simulados para demostración
    const stats = [
        { title: 'Ingresos MRR', value: '$240.00', growth: 12, isAlert: false },
        { title: 'Guías Afiliados', value: '12', growth: null, isAlert: true, subtitle: '2 nuevas solicitudes' }, // Alert simulates pending reviews
        { title: 'Rutas Pendientes', value: '5', growth: null, isAlert: true }, // Alert simulates critical status
        { title: 'Snacks Distribuidos', value: '450', growth: 8, isAlert: false }
    ];

    const guides = [
        { id: 1, name: "Mateo Shiki", status: "active", routesCount: 15, rating: 4.9 },
        { id: 2, name: "Carla P.", status: "basic", routesCount: 3, rating: 4.2 },
        { id: 3, name: "Asoc. Tayos", status: "active", routesCount: 8, rating: 5.0 },
    ];

    return (
        <div className="min-h-screen bg-jaguar-950 pb-20 pt-20 px-4 md:px-8 space-y-8 animate-fade-in text-white/90">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
                        Jaguar <span className="text-[#C5A059]">Console</span>
                    </h1>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                        Estado del Ecosistema • Morona Santiago
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
                    <RefreshCw size={14} /> Actualizar
                </button>
            </div>

            {/* 1. KPIs de Control */}
            <section>
                <h2 className="text-[#C5A059] text-xs font-bold uppercase tracking-widest mb-4 opacity-80">
                    KPIs de Control
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <StatCard
                            key={idx}
                            title={stat.title}
                            value={stat.value}
                            growth={stat.growth}
                            isAlert={stat.isAlert}
                        />
                    ))}
                </div>
            </section>

            {/* 2. Estado de Guías */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-[#C5A059] text-xs font-bold uppercase tracking-widest opacity-80">
                        Red de Exploradores
                    </h2>
                    <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Ver todos</a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map(guide => (
                        <GuiaStatCard
                            key={guide.id}
                            {...guide}
                        />
                    ))}
                </div>
            </section>

            {/* Insights Panel (Placeholder for future AI insights) */}
            <section className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-2xl p-6 border border-indigo-500/20">
                <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-2">
                    ✨ Jaguar AI Insights
                </h3>
                <p className="text-gray-300 text-sm">
                    "Se ha detectado un aumento del 25% en búsquedas sobre 'Cueva de los Tayos'. Se recomienda activar campaña de promoción para guías certificados en esa zona."
                </p>
            </section>

        </div>
    );
};

export default DashboardView;
