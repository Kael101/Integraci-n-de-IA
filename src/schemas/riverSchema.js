import { z } from 'zod';

// --- 1. ENTIDADES PRINCIPALES (CORE DATA) ---

export const rioSchema = z.object({
  nombre: z.string().min(2, "El nombre del río es requerido").max(100),
  cuenca_hidrografica: z.string().min(2, "La cuenca hidrográfica es requerida").max(100),
  descripcion_general: z.string().max(2000).optional(),
});

export const tramoRioSchema = z.object({
  id_rio: z.string().min(1, "El ID del río es requerido"), // Referencia a Rios
  nombre_tramo: z.string().min(2, "El nombre del tramo es requerido").max(100),
  distancia_km: z.coerce.number().positive("La distancia debe ser positiva"),
  duracion_estimada_hrs: z.coerce.number().positive("La duración estimada debe ser positiva"),
  clase_dificultad: z.enum(["Clase I", "Clase II", "Clase III", "Clase IV", "Clase V", "Clase VI"]),
  temporada_recomendada: z.string().max(100).optional(),
  requiere_guia: z.boolean().default(true),
});

// --- 2. ENTIDADES DE GEOLOCALIZACIÓN Y LOGÍSTICA ---

export const puntoAccesoSchema = z.object({
  id_tramo: z.string().min(1, "El ID del tramo es requerido"), // Referencia a Tramos_Rio
  tipo_acceso: z.enum(["Put-in", "Take-out", "Emergencia", "Campamento"]),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  descripcion_acceso: z.string().max(500).optional(),
});

export const actividadTramoSchema = z.object({
  id_tramo: z.string().min(1, "El ID del tramo es requerido"), // Referencia a Tramos_Rio
  deporte: z.enum(["Kayak", "Rafting", "Tubing", "Paddleboard"]),
  nivel_experiencia_requerido: z.enum(["Principiante", "Intermedio", "Avanzado", "Experto"]),
});

// --- 3. ENTIDADES DE SEGURIDAD Y COMUNIDAD (DINÁMICAS) ---

export const condicionActualSchema = z.object({
  id_tramo: z.string().min(1, "El ID del tramo es requerido"), // Referencia a Tramos_Rio
  id_usuario: z.string().min(1, "El ID del usuario es requerido"),
  nivel_agua: z.enum(["Bajo", "Normal", "Alto", "Peligroso"]),
  estado_navegabilidad: z.enum(["Abierto", "Precaución", "Cerrado"]),
  peligros_reportados: z.string().max(3000).optional(),
  fecha_reporte: z.date().or(z.string().datetime()), // Permite Timestamp o string ISO
});
