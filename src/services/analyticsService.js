// src/services/analyticsService.js
import { logEvent, setUserProperties } from "firebase/analytics";
import { analytics } from "../config/firebase";

/**
 * SERVICIO DE ANALYTICS - TERRITORIO JAGUAR
 * Tracking de eventos para métricas de uso del sistema multi-agente
 */

class AnalyticsService {
    constructor() {
        this.enabled = import.meta.env.PROD; // Solo en producción
    }

    /**
     * Registrar consulta procesada por el Orquestador
     */
    trackAgentQuery(intent, userLevel, responseTime) {
        if (!this.enabled) return;

        logEvent(analytics, 'agent_query', {
            intent_type: intent,
            user_level: userLevel,
            response_time_ms: responseTime,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar alerta de seguridad del Agente A
     */
    trackSafetyAlert(alertType, sector, blocked) {
        if (!this.enabled) return;

        logEvent(analytics, 'safety_alert', {
            alert_type: alertType,
            sector: sector,
            route_blocked: blocked,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar interacción con Estación AR
     */
    trackARStationView(stationId, detection, durationSeconds) {
        if (!this.enabled) return;

        logEvent(analytics, 'ar_station_view', {
            station_id: stationId,
            has_detection: !!detection,
            jaguar_id: detection?.individuoId || 'none',
            duration_seconds: durationSeconds,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar recomendación de ruta del Agente B
     */
    trackRouteRecommendation(routeName, daylight, servicesCount) {
        if (!this.enabled) return;

        logEvent(analytics, 'route_recommendation', {
            route_name: routeName,
            within_daylight: daylight,
            services_count: servicesCount,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar visualización de producto del Agente C
     */
    trackProductView(productId, category, price) {
        if (!this.enabled) return;

        logEvent(analytics, 'product_view', {
            product_id: productId,
            category: category,
            price: price,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar intención de compra
     */
    trackPurchaseIntent(productId, storytelling) {
        if (!this.enabled) return;

        logEvent(analytics, 'purchase_intent', {
            product_id: productId,
            has_storytelling: !!storytelling,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar reporte de campo validado
     */
    trackFieldReport(reportType, validated, points) {
        if (!this.enabled) return;

        logEvent(analytics, 'field_report', {
            report_type: reportType,
            validated: validated,
            points_awarded: points,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Configurar propiedades del usuario
     */
    setUserLevel(level) {
        if (!this.enabled) return;

        setUserProperties(analytics, {
            user_level: level,
            last_active: new Date().toISOString()
        });
    }

    /**
     * Registrar error del sistema
     */
    trackError(errorType, errorMessage, context) {
        if (!this.enabled) return;

        logEvent(analytics, 'system_error', {
            error_type: errorType,
            error_message: errorMessage,
            context: JSON.stringify(context),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar tiempo de sesión
     */
    trackSessionDuration(durationMinutes) {
        if (!this.enabled) return;

        logEvent(analytics, 'session_end', {
            duration_minutes: durationMinutes,
            timestamp: new Date().toISOString()
        });
    }
}

export const analyticsService = new AnalyticsService();
