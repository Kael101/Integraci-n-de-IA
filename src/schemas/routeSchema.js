import { z } from 'zod';

export const routeValidationSchema = z.object({
    // --- SECCIÓN 1: INFORMACIÓN BÁSICA ---
    name: z
        .string()
        .min(5, "El nombre de la ruta es muy corto")
        .max(60, "El nombre no debe exceder los 60 caracteres"),

    category: z.enum(["Trekking", "Ciclismo", "Avistamiento de Aves", "Cultural", "Fotografía", "Aventura"], {
        errorMap: () => ({ message: "Por favor, selecciona una categoría válida" }),
    }),

    difficulty: z.enum(["Bajo", "Medio", "Alto", "Experto"]),

    shortDescription: z.string().max(150, "La descripción corta no debe exceder 150 caracteres").optional(),

    fullDescription: z
        .string()
        .min(20, "Cuéntanos un poco más sobre la ruta (mínimo 20 caracteres)")
        .max(2000, "La descripción es demasiado larga"),

    // --- SECCIÓN 2: DATOS TÉCNICOS ---
    duration: z
        .string()
        .min(1, "Ingresa una duración estimada (Ej: 2h 30m)"),
    //.regex(/^([0-9]+h)?\s?([0-5][0-9]m)?$/, "Formato sugerido: 2h 30m"), // Relaxed regex for now as free text is often used

    distance: z
        .coerce.number({ invalid_type_error: "Debe ser un número válido" })
        .positive("La distancia debe ser mayor a 0")
        .min(0.1, "Mínimo 100 metros")
        .optional()
        .or(z.literal('')),

    // --- SECCIÓN 3: PUNTOS DE INTERÉS ---
    waypoints: z.array(z.any()).optional(),

    // --- SECCIÓN 4: CONTACTO Y AFILIACIÓN ---
    guideName: z.string().optional(),

    price: z
        .coerce.number()
        .min(0, "El precio no puede ser negativo")
        .optional()
        .or(z.literal('')),

    contactNumber: z
        .string()
        .regex(/^\+?[0-9\s-]{7,15}$/, "Ingresa un número de teléfono válido")
        .optional()
        .or(z.literal('')),

    // --- SECCIÓN 5: LOGÍSTICA ---
    signalAvailable: z.enum(["Nula", "Intermitente", "Buena"]),

    termsAccepted: z.literal(true, {
        errorMap: () => ({ message: "Debes aceptar los términos y condiciones de guía" }),
    }),
});

// Tipo de datos extraído del esquema para TypeScript
// export type RouteFormData = z.infer<typeof routeValidationSchema>;
