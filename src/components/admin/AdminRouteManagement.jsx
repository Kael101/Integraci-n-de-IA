import React, { useState, useMemo } from 'react';
import { isWithinMoronaSantiago, isNearSevillaDonBosco } from '../../utils/routeValidation';
import { AlertTriangle, CheckCircle, XCircle, FileText, MapPin, User, ShieldCheck } from 'lucide-react';

/**
 * AdminRouteManagement Component
 * 
 * A premium administrative dashboard for managing pending route submissions.
 * Features: Glassmorphism design, GPX validation, Cultural feedback.
 */
const AdminRouteManagement = ({ pendingRoutes = [] }) => {
  const [routes, setRoutes] = useState(pendingRoutes);

  // Business Logic: Process routes with validation results
  const processedRoutes = useMemo(() => {
    return routes.map(route => {
      const isSafe = isWithinMoronaSantiago(route.coordinates || []);
      const nearSevilla = isNearSevillaDonBosco(route.coordinates || []);
      
      return {
        ...route,
        isSafe,
        nearSevilla
      };
    });
  }, [routes]);

  const handleAction = (id, action) => {
    console.log(`Route ${id} ${action}`);
    // Logic to update state or API call would go here
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0D211A] p-8 font-body text-surface selection:bg-brand-gold/30">
      {/* Header del Dashboard */}
      <header className="mb-10 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-[0.2em] text-white">
            Gestión de Rutas
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-[2px] bg-brand-gold"></span>
            <p className="text-brand-gold font-bold tracking-wider text-sm uppercase">🐆 Jaguar-OS: Control de Calidad Territorial</p>
          </div>
        </div>
        
        <div className="bg-brand-emerald/40 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl flex flex-col items-end">
          <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Rutas en espera</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-display font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              {processedRoutes.length}
            </p>
            <span className="text-xs opacity-40 uppercase">Pendientes</span>
          </div>
        </div>
      </header>

      {/* Tabla de Rutas Pendientes (Glassmorphism Style) */}
      <div className="bg-brand-emerald/20 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70">Guía / Autor</th>
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70">Nombre de la Ruta</th>
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70">Cantón / Zona</th>
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70 text-center">Validación QA</th>
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70">Archivo (GPX)</th>
                <th className="p-6 text-xs uppercase tracking-[0.15em] font-display font-bold opacity-70 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedRoutes.map((route) => (
                <tr key={route.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold to-[#A38240] flex items-center justify-center font-display font-black text-[#0D211A] shadow-lg group-hover:scale-110 transition-transform">
                          {route.author_initials}
                        </div>
                        {route.is_affiliated && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-[#1B3B2F] shadow-lg">
                            <ShieldCheck size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-wide">{route.author_name}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${route.is_affiliated ? 'text-brand-gold' : 'text-white/40'}`}>
                          {route.is_affiliated ? '⭐ Verificado' : 'Explorador Básico'}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-6 font-semibold text-white/90">
                    <div className="flex flex-col gap-1">
                      <span>{route.title}</span>
                      {route.nearSevilla && (
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-gold font-bold bg-brand-gold/10 px-2 py-0.5 rounded-full w-fit animate-pulse border border-brand-gold/20">
                          <AlertTriangle size={10} />
                          Cultural: Sugerir Jungle Protein Bites
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-6">
                    <div className="flex items-center gap-2 opacity-80 italic text-sm">
                      <MapPin size={14} className="text-brand-gold" />
                      {route.region}
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      route.isSafe 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {route.isSafe ? (
                        <><CheckCircle size={12} /> Zona Segura</>
                      ) : (
                        <><XCircle size={12} /> Fuera de Rango</>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-6">
                    <button className="group/btn flex items-center gap-2 text-[10px] font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 hover:border-brand-gold/40 transition-all duration-300">
                      <FileText size={14} className="group-hover/btn:text-brand-gold" />
                      GPX {route.file_type}
                    </button>
                  </td>
                  
                  <td className="p-6">
                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => handleAction(route.id, 'approve')}
                        disabled={!route.isSafe}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${
                          route.isSafe 
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 hover:scale-105 active:scale-95' 
                            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        Aprobar
                      </button>
                      <button 
                        onClick={() => handleAction(route.id, 'reject')}
                        className="bg-red-600/10 text-red-400 border border-red-600/20 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-red-600/30 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {processedRoutes.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4 opacity-40">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
               <ShieldCheck size={40} />
            </div>
            <p className="font-display uppercase tracking-widest font-bold">No hay rutas pendientes de validación</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRouteManagement;
