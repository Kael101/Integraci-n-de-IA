import React, { useState } from 'react';
import { condicionActualSchema } from '../../schemas/riverSchema';
import { addRiverReport } from '../../services/firebase/riverReportsService';

/**
 * RiverReportDialog
 * Modal para que guías y usuarios reporten condiciones del río.
 * Valida los datos contra Zod antes de enviarlos hacia Firebase.
 *
 * @param {Object} props
 * @param {string} props.tramoId - ID del tramo de río sobre el que se reporta
 * @param {string} props.tramoNombre - Nombre legible para el usuario
 * @param {Function} props.onClose - Cerrar dialog
 * @param {Function} props.onSubmit - Callback onSuccess
 */
export default function RiverReportDialog({ tramoId, tramoNombre, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    nivel_agua: 'Normal',
    estado_navegabilidad: 'Abierto',
    peligros_reportados: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones basadas en el Enum de riverSchema.js
  const nivelesAgua = ["Bajo", "Normal", "Alto", "Peligroso"];
  const estadosNav = ["Abierto", "Precaución", "Cerrado"];

  // Lógica de "Semáforo Automático"
  // Si el usuario selecciona agua "Peligroso", sugerir cerrar el río.
  const handleNivelChange = (nivel) => {
    setFormData(prev => ({
      ...prev,
      nivel_agua: nivel,
      ...(nivel === 'Peligroso' ? { estado_navegabilidad: 'Cerrado' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // 1. Preparar payload simulando datos automáticos (ID usuario local/mock por ahora)
      const mockUserId = "user_" + Math.random().toString(36).substring(7);
      const payload = {
        id_tramo: tramoId || "tramo_upano_01",
        nivel_agua: formData.nivel_agua,
        estado_navegabilidad: formData.estado_navegabilidad,
        peligros_reportados: formData.peligros_reportados,
        fecha_reporte: new Date().toISOString()
      };

      // 2. Validar con Zod (riverSchema.js)
      const validData = condicionActualSchema.parse({
        ...payload,
        id_usuario: mockUserId
      });

      // 3. Escribir en Firebase (Batch Write)
      await addRiverReport(validData, mockUserId);
      console.log("✅ Reporte validado y guardado en Firebase:", validData);
      
      // 4. Éxito
      onSubmit && onSubmit(validData);
      onClose();
      
    } catch (err) {
      if (err.issues) {
        // Errores de Zod
        const newErrors = {};
        err.issues.forEach(issue => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      } else {
        console.error("Error inesperado guardando reporte:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: '#1e293b',
        width: '90%', maxWidth: 400,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Cabecera */}
        <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 700 }}>⚠️ Reportar Condición</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
            Tramo: <strong style={{ color: '#e2e8f0' }}>{tramoNombre || "Río Desconocido"}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          
          {/* Nivel de Agua */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Nivel de Agua Actual
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {nivelesAgua.map(nivel => (
                <button
                  key={nivel}
                  type="button"
                  onClick={() => handleNivelChange(nivel)}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    border: formData.nivel_agua === nivel 
                      ? `1px solid ${nivel === 'Peligroso' ? '#ef4444' : '#38bdf8'}` 
                      : '1px solid rgba(255,255,255,0.1)',
                    background: formData.nivel_agua === nivel 
                      ? `${nivel === 'Peligroso' ? '#ef4444' : '#38bdf8'}20` 
                      : 'rgba(255,255,255,0.03)',
                    color: formData.nivel_agua === nivel ? '#fff' : '#94a3b8',
                    fontWeight: formData.nivel_agua === nivel ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de Navegabilidad */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Recomendación de Seguridad (Sémaforo)
            </label>
            <select
              value={formData.estado_navegabilidad}
              onChange={e => setFormData({...formData, estado_navegabilidad: e.target.value})}
              style={{
                width: '100%', padding: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#f8fafc', fontSize: 14,
                outline: 'none'
              }}
            >
              {estadosNav.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          {/* Peligros Reportados */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Detalles del Peligro (Opcional)
            </label>
            <textarea
              value={formData.peligros_reportados}
              onChange={e => setFormData({...formData, peligros_reportados: e.target.value})}
              placeholder="Ej. Árbol caído bloqueando el lado izquierdo del rápido principal."
              rows={3}
              style={{
                width: '100%', padding: '12px', boxSizing: 'border-box',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#f8fafc', fontSize: 14,
                resize: 'none', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {errors.peligros_reportados && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                {errors.peligros_reportados}
              </span>
            )}
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#cbd5e1', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                background: formData.estado_navegabilidad === 'Cerrado' ? '#ef4444' : '#f97316',
                color: 'white', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: `0 4px 12px ${formData.estado_navegabilidad === 'Cerrado' ? '#ef4444' : '#f97316'}40`
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte a la Red'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
