// src/agents/fieldAgent.js
/**
 * AGENTE A: ESPECIALISTA EN CAMPO Y AR (GUÍAS)
 * Responsable de seguridad, detecciones IA y datos para estaciones AR
 */

import { getLastJaguarDetection } from '../services/arStationService.js';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import knowledgeBase from '../data/knowledge_base.json';

class FieldAgent {
    constructor() {
        this.name = "Agente Campo y AR";
        this.redAlertThreshold = 100; // metros - distancia mínima a jaguar con crías
        this.knowledge = knowledgeBase;
    }

    /**
     * Consultar Base de Conocimiento (Flora/Fauna)
     */
    consultKnowledge(topic) {
        const lowerTopic = topic.toLowerCase();

        // Buscar en Fauna
        for (const [key, data] of Object.entries(this.knowledge.fauna)) {
            if (lowerTopic.includes(key) || lowerTopic.includes(data.nombre.toLowerCase())) {
                return {
                    found: true,
                    type: 'fauna',
                    data: data,
                    response: `🐾 **${data.nombre}** (${data.shuar ? 'Shuar: ' + data.shuar : ''})\n${data.descripcion}\n💡 Dato: ${data.comportamiento || data.funcion}`
                };
            }
        }

        // Buscar en Flora
        for (const [key, data] of Object.entries(this.knowledge.flora)) {
            if (lowerTopic.includes(key) || lowerTopic.includes(data.nombre.toLowerCase())) {
                return {
                    found: true,
                    type: 'flora',
                    data: data,
                    response: `🌿 **${data.nombre}**\n${data.descripcion}\n💊 Uso tradicional: ${data.uso}\n📜 *Esta especie ha sido usada desde tiempos de la cultura Upano.*`
                };
            }
        }

        return { found: false };
    }

    /**
     * Verificar alertas de seguridad en un sector
     */
    async checkSafetyAlerts(location) {
        try {
            // Consultar detecciones recientes (últimas 24h)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const q = query(
                collection(db, "detecciones_ia"),
                where("timestamp", ">=", yesterday.toISOString())
            );

            const snapshot = await getDocs(q);
            const detections = snapshot.docs.map(doc => doc.data());

            // Verificar alerta roja (jaguar con crías)
            const redAlert = detections.find(d =>
                d.comportamiento === "con_crias" ||
                d.comportamiento === "marcando_territorio"
            );

            return {
                hasRedAlert: !!redAlert,
                alerts: redAlert ? [{
                    type: "RED",
                    reason: "Jaguar con crías detectado. Acceso restringido por seguridad.",
                    sector: redAlert.sector
                }] : [],
                recentDetections: detections.length,
                probability: this.calculateProbability(detections),
                reason: redAlert ? "Protección de fauna en periodo crítico" : null
            };

        } catch (error) {
            console.error("Error checking safety alerts:", error);
            return {
                hasRedAlert: false,
                alerts: [],
                recentDetections: 0,
                probability: "Desconocida"
            };
        }
    }

    /**
     * Obtener datos para inyectar en Estación AR
     */
    async getARStationData(sector) {
        try {
            const detection = await getLastJaguarDetection(sector);

            if (!detection) {
                return { detection: null, arBehavior: null };
            }

            // Determinar comportamiento AR basado en datos reales
            const arBehavior = {
                animation: this.mapBehaviorToAnimation(detection.comportamiento),
                shouldRoar: detection.vocalizacion,
                speed: detection.velocidad,
                individuoId: detection.individuoId
            };

            const timeSince = this.calculateTimeSince(detection.timestamp);

            return {
                detection,
                arBehavior,
                timeSince,
                sector
            };

        } catch (error) {
            console.error("Error getting AR station data:", error);
            return { detection: null, arBehavior: null };
        }
    }

    /**
     * Validar y registrar reporte de campo
     */
    async validateReport(reportData) {
        try {
            // Validación básica
            if (!reportData.query || reportData.query.length < 10) {
                return { success: false, reason: "Descripción muy corta" };
            }

            // Registrar en Firestore
            const report = {
                tipo: "avistamiento_usuario",
                descripcion: reportData.query,
                timestamp: new Date().toISOString(),
                validado: false,
                requiere_revision: true
            };

            await addDoc(collection(db, "reportes_campo"), report);

            return {
                success: true,
                message: "Reporte enviado a validación de guías expertos",
                points: 25 // Puntos de "Aliado del Jaguar"
            };

        } catch (error) {
            console.error("Error validating report:", error);
            return { success: false, reason: "Error técnico" };
        }
    }

    /**
     * Mapear comportamiento real a animación AR
     */
    mapBehaviorToAnimation(comportamiento) {
        const mapping = {
            'caminando': 'walk',
            'corriendo': 'run',
            'marcando_territorio': 'mark_territory',
            'cazando': 'stalk',
            'descansando': 'rest'
        };
        return mapping[comportamiento] || 'walk';
    }

    /**
     * Calcular tiempo transcurrido desde detección
     */
    calculateTimeSince(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins} minutos`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} horas`;
        return `${Math.floor(diffHours / 24)} días`;
    }

    /**
     * Calcular probabilidad de avistamiento
     */
    calculateProbability(detections) {
        if (detections.length === 0) return "Baja (0-20%)";
        if (detections.length < 3) return "Media (20-50%)";
        if (detections.length < 5) return "Alta (50-80%)";
        return "Muy Alta (80-100%)";
    }
}

export const fieldAgent = new FieldAgent();
