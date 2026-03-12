import React, { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';

/**
 * RiverHazardPins - "Pines de Alerta (Crowdsourcing)"
 * Muestra marcadores interactivos en el mapa para reportes de peligro en el río.
 *
 * @param {Object} props
 * @param {Array} props.hazards - Lista de peligros reportados
 */
export default function RiverHazardPins({ hazards = [] }) {
  const [selectedHazard, setSelectedHazard] = useState(null);

  const getHazardIcon = (type) => {
    switch (type) {
      case 'ArbolCaido': return '🪵';
      case 'RocaNueva': return '🪨';
      case 'CorrienteFuerte': return '🌊';
      case 'Basura': return '🗑️';
      default: return '⚠️';
    }
  };

  return (
    <>
      {hazards.map(hazard => (
        <Marker
          key={hazard.id}
          latitude={hazard.latitud}
          longitude={hazard.longitud}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            setSelectedHazard(hazard);
          }}
        >
          <div style={{
            width: 34, height: 34,
            background: 'rgba(239, 68, 68, 0.95)', // Rojo alerta
            border: '2px solid #fff',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            cursor: 'pointer',
            transform: selectedHazard?.id === hazard.id ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {getHazardIcon(hazard.tipo_peligro)}
          </div>
        </Marker>
      ))}

      {selectedHazard && (
        <Popup
          latitude={selectedHazard.latitud}
          longitude={selectedHazard.longitud}
          anchor="top"
          offset={16}
          onClose={() => setSelectedHazard(null)}
          closeOnClick={false}
          style={{ borderRadius: 12, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <div style={{ padding: '12px', maxWidth: 220, background: '#1e293b', color: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{getHazardIcon(selectedHazard.tipo_peligro)}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                  ¡Precaución!
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  Hace {selectedHazard.tiempo_transcurrido} • Por {selectedHazard.usuario}
                </div>
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 8, 
              padding: '8px', 
              fontSize: 12, 
              lineHeight: 1.4,
              borderLeft: '3px solid #ef4444' 
            }}>
              {selectedHazard.descripcion}
            </div>

            {selectedHazard.fotoUrl && (
              <img 
                src={selectedHazard.fotoUrl} 
                alt="Peligro en el río" 
                style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} 
              />
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
