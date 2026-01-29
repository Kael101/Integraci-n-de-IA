// src/agents/orchestrator.js
/**
 * AGENTE ORQUESTADOR - TERRITORIO JAGUAR
 * Cerebro central que coordina las consultas del usuario con los agentes especialistas
 */

import { fieldAgent } from './fieldAgent.js';
import { tourismAgent } from './tourismAgent.js';
import { biocommerceAgent } from './biocommerceAgent.js';
import { analyticsService } from '../services/analyticsService.js';
import { conversationManager } from './conversationManager.js';
import { mcpClient } from '../services/mcpClient.js';

class OrchestratorAgent {
    constructor() {
        this.name = "Orquestador Territorio Jaguar";
        this.conversationManager = conversationManager;
        this.userId = 'current_user'; // En producción, esto vendría del AuthContext
    }

    /**
     * Consultar memoria persistente
     */
    async checkMemory(query) {
        try {
            const memory = await mcpClient.callTool('openmemory', 'openmemory_query', {
                query: query,
                user_id: this.userId,
                limit: 2
            });

            if (memory && memory.content && memory.content.length > 0) {
                const memories = memory.content[0].text;
                console.log('🧠 Memoria recuperada:', memories);
                return memories;
            }
        } catch (error) {
            console.warn('⚠️ Falló lectura de memoria:', error);
        }
        return null;
    }

    /**
     * Guardar interacción en memoria
     */
    async saveToMemory(query, response) {
        try {
            // Sintetizar lo que vale la pena recordar (hechos, preferencias)
            // Por ahora guardamos la interacción completa para que el modelo la procese
            await mcpClient.callTool('openmemory', 'openmemory_store', {
                text: `User asked: "${query}". System answered: "${response}"`,
                user_id: this.userId,
                tags: ['interaction']
            });
            console.log('💾 Interacción guardada en memoria.');
        } catch (error) {
            console.warn('⚠️ Falló escritura en memoria:', error);
        }
    }

    /**
     * Chain of Thought: Procesa consulta del usuario siguiendo el protocolo
     * @param {string} userQuery - Consulta del usuario
     * @param {Object} context - Contexto (ubicación, nivel usuario, etc.)
     */
    async processQuery(userQuery, context = {}) {
        console.log(`🧠 Orquestador recibió: "${userQuery}"`);

        // PASO 0: Consultar Memoria Persistente (OpenMemory)
        const memoryContext = await this.checkMemory(userQuery);
        if (memoryContext) {
            console.log("📜 Contexto histórico:", memoryContext);
            // Inyectar memoria en el contexto para que los agentes la usen (futuro)
            // Por ahora, solo lo logueamos o lo podríamos concatenar para la síntesis
            context.memory = memoryContext;
        }

        // PASO 1: Identificar Intención
        const intent = this.classifyIntent(userQuery);
        console.log(`📊 Intención detectada: ${intent.type}`);

        // PASO 2: Consultar Contexto según intención
        let response = {
            intent: intent.type,
            data: {},
            safety: { alerts: [], blocked: false }
        };

        try {
            switch (intent.type) {
                case 'exploration':
                    // Consultar Agente B (Turismo) + Agente A (Campo)
                    const [tourismData, fieldData] = await Promise.all([
                        tourismAgent.getRouteRecommendations(context.location),
                        fieldAgent.checkSafetyAlerts(context.location)
                    ]);

                    // PRIORIDAD: Agente A tiene la última palabra en seguridad
                    if (fieldData.hasRedAlert) {
                        response.safety.blocked = true;
                        response.safety.alerts = fieldData.alerts;
                        response.message = "⚠️ Ruta bloqueada temporalmente por seguridad de fauna. " + fieldData.reason;
                    } else {
                        response.data = { tourism: tourismData, field: fieldData };
                        response.message = this.synthesizeExplorationResponse(tourismData, fieldData);
                    }
                    break;

                case 'purchase':
                    // Consultar Agente C (Biocomercio)
                    const catalogData = await biocommerceAgent.getCatalog(intent.category);
                    response.data = catalogData;
                    response.message = this.synthesizePurchaseResponse(catalogData);
                    break;

                case 'bio_report':
                    // Consultar Agente A (Campo) para validar reporte
                    const reportResult = await fieldAgent.validateReport(intent.reportData);
                    response.data = reportResult;
                    response.message = reportResult.success
                        ? "✅ Reporte registrado. ¡Gracias por contribuir a la conservación!"
                        : "❌ No se pudo validar el reporte. Intenta con más detalles.";
                    break;

                case 'ar_station':
                    // Consultar Agente A para datos de AR
                    const arData = await fieldAgent.getARStationData(intent.sector);
                    response.data = arData;
                    response.message = arData.detection
                        ? `🐆 Última detección: ${arData.detection.individuoId} hace ${arData.timeSince}`
                        : "No hay detecciones recientes en este sector.";
                    break;

                case 'educational':
                    // Consultar Agente A (Base de Conocimiento)
                    const knowledgeResult = fieldAgent.consultKnowledge(intent.topic);
                    if (knowledgeResult.found) {
                        response.data = knowledgeResult.data;
                        response.message = knowledgeResult.response;
                    } else {
                        response.message = "No tengo información específica sobre eso en mi base de datos, pero puedo contarte sobre el Jaguar, la Guayusa o el Tapir.";
                    }
                    break;

                default:
                    response.message = "No entendí tu consulta. ¿Buscas explorar rutas, comprar artesanías o reportar un avistamiento?";
            }

        } catch (error) {
            console.error("Error en orquestación:", error);
            response.message = "Ocurrió un error procesando tu solicitud. Intenta nuevamente.";

            // Track error
            analyticsService.trackError('orchestrator_error', error.message, { query: userQuery });
        }

        // Track query completion
        const endTime = Date.now();
        const responseTime = endTime - (context.startTime || endTime);
        analyticsService.trackAgentQuery(intent.type, context.userLevel || 'unknown', responseTime);

        // Enriquecer respuesta con contexto conversacional
        const enrichedMessage = this.conversationManager.processMessage(userQuery, response);
        response.message = enrichedMessage;

        // PASO FINAL: Guardar en Memoria Persistente
        this.saveToMemory(userQuery, enrichedMessage); // No await para no bloquear respuesta UI

        response.conversationContext = this.conversationManager.getUserContext();

        return response;
    }

    /**
     * Clasificar intención del usuario
     */
    classifyIntent(query) {
        const lowerQuery = query.toLowerCase();

        // Exploración
        if (lowerQuery.match(/ver|jaguar|ruta|sendero|explorar|visitar|dónde/)) {
            return { type: 'exploration' };
        }

        // Compra
        if (lowerQuery.match(/comprar|artesanía|producto|collar|chocolate|miel/)) {
            const category = lowerQuery.match(/artesanía/) ? 'Artesanía' :
                lowerQuery.match(/chocolate|miel|café/) ? 'Gastronomía' : null;
            return { type: 'purchase', category };
        }

        // Reporte biológico
        if (lowerQuery.match(/vi|encontré|huella|avistamiento|reportar/)) {
            return { type: 'bio_report', reportData: { query } };
        }

        // Estación AR
        if (lowerQuery.match(/estación|fantasma|ar|realidad aumentada/)) {
            const sector = lowerQuery.match(/abanico/) ? 'sector_abanico' : 'sector_cascada';
            return { type: 'ar_station', sector };
        }

        // Educativo (Knowledge Base)
        if (lowerQuery.match(/qué es|conoces|cuéntame sobre|historia|flora|fauna|animal|planta|uso/)) {
            return { type: 'educational', topic: lowerQuery };
        }

        return { type: 'unknown' };
    }

    /**
     * Sintetizar respuesta de exploración
     */
    synthesizeExplorationResponse(tourismData, fieldData) {
        let message = `🗺️ **Ruta Recomendada**: ${tourismData.route}\n\n`;
        message += `⏱️ Duración: ${tourismData.duration} (${tourismData.daylight ? '✅ Dentro de horario solar' : '⚠️ Requiere salida temprana'})\n\n`;

        if (fieldData.recentDetections > 0) {
            message += `🐆 **Actividad Reciente**: ${fieldData.recentDetections} detecciones en las últimas 24h\n`;
            message += `💡 Probabilidad de avistamiento: ${fieldData.probability}\n\n`;
        }

        message += `📍 **Servicios Cercanos**: ${tourismData.services.join(', ')}`;
        return message;
    }

    /**
     * Sintetizar respuesta de compra
     */
    synthesizePurchaseResponse(catalogData) {
        if (!catalogData.products || catalogData.products.length === 0) {
            return "No hay productos disponibles en esta categoría actualmente.";
        }

        let message = `🛍️ **Catálogo Disponible**:\n\n`;
        catalogData.products.forEach(product => {
            message += `**${product.name}** - $${product.price}\n`;
            message += `   Artesano: ${product.producer}\n`;
            message += `   ${catalogData.storytelling[product.id]}\n\n`;
        });

        message += `💚 Cada compra financia el monitoreo de jaguares con IA.`;
        return message;
    }
}

export const orchestrator = new OrchestratorAgent();
