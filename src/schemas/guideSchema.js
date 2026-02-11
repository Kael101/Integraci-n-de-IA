import { z } from 'zod';

/**
 * Esquema de Validación para Guía Afiliado
 * Integra requisitos legales (Turismo) y lógica de negocio (Suscripción)
 */
export const GuiaAfiliadoSchema = z.object({
    // Datos de Identidad
    uid: z.string(),
    full_name: z.string().min(5, "Nombre completo requerido"),
    whatsapp: z.string().regex(/^\+593[0-9]{9}$/, "Formato: +593XXXXXXXXX (Ej: +593991234567)"),

    // Verificación Profesional (Requisitos Brand Book)
    credential_id: z.string().min(5, "Registro del Ministerio de Turismo obligatorio"),
    has_first_aid_cert: z.boolean().refine(val => val === true, {
        message: "Debe contar con certificado de primeros auxilios vigente"
    }),

    // Estado de Suscripción (Estructura Firebase)
    is_affiliated: z.boolean().default(false),
    subscription: z.object({
        status: z.enum(['active', 'expired', 'none']),
        plan_type: z.enum(['mensual', 'anual']),
        expiry_date: z.date().or(z.string().transform((str) => new Date(str))), // Permite Date o string ISO
    }),

    // Sinergia Ecosistema
    inventory_jungle_protein: z.boolean().default(false), // ¿Es punto de venta de snacks?
});
