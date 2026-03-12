import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Servicio para conectarse a Firestore:
 * - Colección `tramos`
 * - Sub-colección `tramos/{tramoId}/condiciones`
 */

// 1. Escuchar los Tramos en Tiempo Real (Semáforo Fluvial)
export const subscribeToRiverSegments = (callback) => {
  const tramosRef = collection(db, 'tramos');
  
  return onSnapshot(tramosRef, (snapshot) => {
    const segments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Transformar datos de Firebase al formato GeoJSON FeatureCollection esperado por MapLibre
    const geojson = {
      type: 'FeatureCollection',
      features: segments.map(seg => ({
        type: 'Feature',
        geometry: seg.geometria, // Asume que guardas la geometría { type: 'LineString', coordinates: [...] }
        properties: {
          id: seg.id,
          nombre: seg.nombre_tramo,
          estado_navegabilidad: seg.estado_navegabilidad
        }
      }))
    };
    
    callback(geojson);
  }, (error) => {
    console.error("Error al escuchar tramos:", error);
  });
};

// 2. Escuchar reportes recientes (Pines de Peligro) para un tramo
export const subscribeToRiverHazards = (tramoId, callback) => {
  const condicionesRef = collection(db, `tramos/${tramoId}/condiciones`);
  // Obtenemos los últimos 20 reportes ordenados por fecha
  const q = query(condicionesRef, orderBy('fecha_reporte', 'desc'), limit(20));

  return onSnapshot(q, (snapshot) => {
    const hazards = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        latitud: data.latitud,
        longitud: data.longitud,
        tipo_peligro: data.nivel_agua === 'Peligroso' ? '🌊' : '⚠️',
        descripcion: data.peligros_reportados || `Nivel de agua reportado: ${data.nivel_agua}`,
        // Simulamos tiempo transcurrido, en prod se calcula con data.fecha_reporte vs Date.now()
        tiempo_transcurrido: 'Reciente',
        usuario: data.nombre_usuario || 'Turista'
      };
    }).filter(h => h.latitud && h.longitud); // Solo los que tienen coords

    callback(hazards);
  }, (error) => {
    console.error("Error al escuchar peligros:", error);
  });
};

// 3. Crear un nuevo reporte (Desde el RiverReportDialog)
export const submitRiverSafetyReport = async (tramoId, reportData, userProfile) => {
  try {
    const condicionesRef = collection(db, `tramos/${tramoId}/condiciones`);
    
    // 1. Insertar el Pin de Alerta (permitido para todos)
    const newReport = {
      id_usuario: userProfile?.uid || 'anonymous',
      nombre_usuario: userProfile?.displayName || 'Usuario Anónimo',
      nivel_agua: reportData.nivel_agua,
      estado_navegabilidad: reportData.estado_navegabilidad,
      peligros_reportados: reportData.peligros_reportados,
      latitud: reportData.latitud || null,
      longitud: reportData.longitud || null,
      fecha_reporte: serverTimestamp()
    };
    
    await addDoc(condicionesRef, newReport);

    // 2. ¿Es Guía o Admin? Actualizar el "Semáforo" del tramo padre
    if (userProfile?.role === 'guia' || userProfile?.role === 'admin') {
      const tramoRef = doc(db, 'tramos', tramoId);
      await updateDoc(tramoRef, {
        estado_navegabilidad: reportData.estado_navegabilidad,
        ultimo_actualizacion: serverTimestamp()
      });
      console.log("🟢 Semáforo actualizado por un guía autorizado.");
    } else {
      console.log("📍 Pin de alerta creado localmente (Turista).");
    }

    return { success: true };
  } catch (error) {
    console.error("Error enviando reporte de río:", error);
    throw error;
  }
};
