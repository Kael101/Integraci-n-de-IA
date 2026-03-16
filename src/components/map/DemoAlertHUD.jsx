import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, MapPin, Send, X, AlertCircle } from 'lucide-react';
import { subscribeToAlerts, sendDemoAlert } from '../../services/demoAlertService';

const DemoAlertHUD = ({ userLocation, onSelectAlert }) => {
  const [alerts, setAlerts] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });
    return () => unsubscribe();
  }, []);

  const handleQuickReport = async () => {
    setIsSending(true);
    try {
      await sendDemoAlert({
        titulo: "Incidente en Sendero",
        descripcion: "Obstáculo detectado por turista en tiempo real.",
        lat: userLocation ? userLocation[1] : -2.3121,
        lng: userLocation ? userLocation[0] : -78.1065,
        categoria: "Infraestructura",
        prioridad: "alta"
      });
    } catch (error) {
      console.error("Error en reporte de demo:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isVisible) return (
    <button 
      onClick={() => setIsVisible(true)}
      className="fixed bottom-32 left-6 z-50 p-3 bg-jaguar-500 text-white rounded-full shadow-lg border border-jaguar-400 animate-pulse"
    >
      <Bell size={20} />
    </button>
  );

  return (
    <div className="fixed bottom-32 left-6 z-50 w-72 max-h-[400px] flex flex-col bg-jaguar-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <h3 className="text-[10px] font-black uppercase tracking-tighter text-white/90">Monitor de Alcaldía (Live)</h3>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-white/40 hover:text-white">
          <X size={14} />
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-white/30 text-[9px] uppercase font-bold tracking-widest">
            Esperando reportes...
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => onSelectAlert?.(alert)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                alert.estado === 'resuelto' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-black text-white/80 truncate pr-2">{alert.titulo}</span>
                {alert.estado === 'resuelto' ? (
                  <CheckCircle size={10} className="text-emerald-400" />
                ) : (
                  <Clock size={10} className="text-amber-400 animate-pulse" />
                )}
              </div>
              <p className="text-[8px] text-white/50 line-clamp-2 leading-tight mb-2 italic">
               "{alert.descripcion}"
              </p>
              <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-widest">
                <span className={alert.estado === 'resuelto' ? 'text-emerald-400' : 'text-amber-400'}>
                  {alert.estado}
                </span>
                <span className="text-white/30">{alert.fechaFormateada}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-white/5 border-t border-white/10">
        <button
          onClick={handleQuickReport}
          disabled={isSending}
          className="w-full flex items-center justify-center gap-2 py-2 bg-jaguar-500 hover:bg-jaguar-400 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          {isSending ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={12} />
          )}
          {isSending ? 'Enviando...' : 'Simular Reporte Turista'}
        </button>
      </div>
    </div>
  );
};

export default DemoAlertHUD;
