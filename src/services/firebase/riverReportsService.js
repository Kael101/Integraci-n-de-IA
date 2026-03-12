import { collection, doc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * riverReportsService.js
 * Gestiona la escritura (batch) y suscripción al estado de los ríos.
 */

const REPORTS_COLLECTION = 'river_reports';
const STATUS_COLLECTION = 'river_status';

/**
 * Guarda un reporte de río en el historial y actualiza el estado actual (Semáforo).
 * Utiliza writeBatch para asegurar que ambas operaciones ocurran juntas (transaccionalidad offline).
 *
 * @param {Object} reportData - Datos validados por Zod (con id_tramo, nivel_agua, etc).
 * @param {string} userId - ID o token identificador (eventualmente auth.currentUser.uid).
 * @returns {Promise<void>}
 */
export const addRiverReport = async (reportData, userId) => {
  try {
    const batch = writeBatch(db);

    // 1. Crear documento en historial
    const reportRef = doc(collection(db, REPORTS_COLLECTION));
    batch.set(reportRef, {
      ...reportData,
      id_usuario: userId,
      fecha_creacion: new Date().toISOString()
    });

    // 2. Actualizar/Crear el estado actual del tramo (Ligero para el mapa)
    const statusRef = doc(db, STATUS_COLLECTION, reportData.id_tramo);
    batch.set(statusRef, {
      estado_navegabilidad: reportData.estado_navegabilidad,
      nivel_agua: reportData.nivel_agua,
      ultimo_reporte_ts: reportData.fecha_reporte || new Date().toISOString()
    }, { merge: true });

    // Ejecutar el batch localmente (si está offline) o hacia el servidor
    await batch.commit();
    console.log(`[Firebase] Batch write exitoso para tramo ${reportData.id_tramo}`);
  } catch (error) {
    console.error('[Firebase] Error al guardar reporte de río:', error);
    throw error;
  }
};

/**
 * Suscripción en tiempo real a la colección ligera 'river_status'.
 * Ideal para re-colorear el mapa sin cargar todo el historial.
 *
 * @param {Function} onUpdate - Callback con el diccionario de estados {[id_tramo]: estado}
 * @returns {Function} unsubscribe - Función para desuscribirse
 */
export const subscribeToRiverStatus = (onUpdate) => {
  const q = collection(db, STATUS_COLLECTION);
  
  return onSnapshot(q, (snapshot) => {
    const statusMap = {};
    snapshot.forEach((doc) => {
      // Retorna el tramo y su estado (estado_navegabilidad)
      statusMap[doc.id] = doc.data();
    });
    
    onUpdate(statusMap);
  }, (error) => {
    console.error('[Firebase] Error en suscripción de river_status:', error);
  });
};
