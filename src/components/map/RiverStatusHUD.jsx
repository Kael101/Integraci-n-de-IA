import React, { useState } from 'react';

/**
 * RiverStatusHUD - "Medidor de Caudal Visual y Controles Rápido"
 * Panel flotante que muestra el nivel del agua y permite crear alertas.
 *
 * @param {Object} props
 * @param {string} props.tramoNombre - Nombre del tramo actual (ej. "Garganta del Upano")
 * @param {string} props.nivelAgua - Estado actual ("Bajo", "Normal", "Alto", "Peligroso")
 * @param {Function} props.onReportSOS - Función para abrir dialog de reporte rápido
 */
export default function RiverStatusHUD({ 
  tramoNombre = "Cargando río...", 
  nivelAgua = "Normal",
  onReportSOS 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Configuración visual según el nivel del agua
  const watermarkConfig = {
    Bajo:      { color: '#38bdf8', icon: '💧', label: 'Caudal Bajo', wavesHeight: '20%' },
    Normal:    { color: '#10b981', icon: '〰️', label: 'Caudal Normal', wavesHeight: '40%' },
    Alto:      { color: '#f59e0b', icon: '🌊', label: 'Caudal Alto', wavesHeight: '70%' },
    Peligroso: { color: '#ef4444', icon: '⚠️', label: 'Nivel Peligroso', wavesHeight: '90%' }
  }[nivelAgua] || { color: '#94a3b8', icon: '❓', label: 'Sin Datos', wavesHeight: '0%' };

  const isDanger = nivelAgua === 'Peligroso';

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      width: '90%',
      maxWidth: 360,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Banner de Advertencia Crítica */}
      {isDanger && (
        <div style={{
          background: '#ef4444',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '12px 12px 0 0',
          fontSize: 12,
          fontWeight: 700,
          textAlign: 'center',
          animation: 'pulse 2s infinite',
          boxShadow: '0 -4px 12px rgba(239, 68, 68, 0.4)'
        }}>
          ⛔ RÍO CERRADO POR CRECIDA: EVITE EL INGRESO
        </div>
      )}

      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: isDanger ? '0 0 12px 12px' : '16px',
        border: `1px solid ${isDanger ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Gráfico de Ondas Dinámico (Fondo) */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: watermarkConfig.wavesHeight,
          background: `linear-gradient(to top, ${watermarkConfig.color}40, transparent)`,
          borderTop: `2px solid ${watermarkConfig.color}80`,
          transition: 'height 1s ease-in-out',
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: '0 0 12px 12px'
        }} />

        {/* Info Principal */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tramo Actual</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{tramoNombre}</div>
          </div>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 6, 
            background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: 8,
            border: `1px solid ${watermarkConfig.color}40`
          }}>
            <span style={{ fontSize: 16 }}>{watermarkConfig.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: watermarkConfig.color }}>
              {watermarkConfig.label}
            </span>
          </div>
        </div>

        {/* Botón de Reporte Rápido (Crowdsourcing) */}
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onReportSOS}
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 4,
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: isHovered ? '#ea580c' : '#f97316',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isHovered ? '0 4px 16px rgba(249, 115, 22, 0.4)' : 'none'
          }}
        >
          <span>🚨</span> Reportar Alerta en el Río
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { background: #ef4444; }
          50% { background: #b91c1c; }
          100% { background: #ef4444; }
        }
      `}</style>
    </div>
  );
}
