/**
 * demoAlertService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de comunicación en tiempo real para la demostración "Territorio Jaguar".
 * 
 * Este servicio permite:
 * 1. Suscribirse a alertas de conservación (Firestore -> App).
 * 2. Enviar reportes ciudadanos instantáneos (App -> Firestore).
 */

import { db } from '../config/firebase'; 
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy,
  limit 
} from 'firebase/firestore';

const COLLECTION_NAME = 'alertas_conservacion';

/**
 * DE LA APP A FIREBASE: Enviar un nuevo reporte de demo.
 * @param {Object} alertData - Datos del reporte { titulo, descripcion, lat, lng, categoria }
 */
export const sendDemoAlert = async (alertData) => {
  try {
    const alertsRef = collection(db, COLLECTION_NAME);
    
    const payload = {
      ...alertData,
      estado: alertData.estado || 'pendiente',
      prioridad: alertData.prioridad || 'media',
      timestamp: serverTimestamp(),
      autor: 'Turista (Demo)',
    };

    const docRef = await addDoc(alertsRef, payload);
    console.log("🟢 [Demo] Reporte enviado con éxito. ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("🔴 [Demo] Error al enviar reporte:", error);
    throw error;
  }
};

/**
 * DE FIREBASE A LA APP: Escuchar cambios en tiempo real.
 * @param {Function} callback - Función que recibe la lista actualizada de alertas.
 * @returns {Function} Unsubscribe - Función para detener el listener.
 */
export const subscribeToAlerts = (callback) => {
  const alertsRef = collection(db, COLLECTION_NAME);
  
  // Traemos los últimos 15 reportes para no saturar la UI de la demo
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(15));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const alertsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Helper: Convertir timestamp de Firestore a Date para la UI
      fechaFormateada: doc.data().timestamp?.toDate()?.toLocaleTimeString() || 'Procesando...'
    }));
    
    callback(alertsList);
  }, (error) => {
    console.error("🔴 [Demo] Error en el listener de alertas:", error);
  });

  return unsubscribe; 
};

export default {
  sendDemoAlert,
  subscribeToAlerts
};
