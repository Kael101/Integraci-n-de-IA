// src/agents/conversationManager.js
/**
 * GESTOR DE CONVERSACIÓN - TERRITORIO JAGUAR
 * Maneja el contexto, tono y fluidez de las interacciones con el usuario
 */

class ConversationManager {
    constructor() {
        this.conversationHistory = [];
        this.userContext = {
            name: null,
            level: 'bronze',
            interests: [],
            previousQueries: []
        };

        // Personalidad del asistente
        this.personality = {
            tone: 'guardian_del_tiempo',
            values: ['respeto_ancestral', 'asombro_cientifico', 'conservación_activa'],
            expertise: ['arqueología_upano', 'ecología_profunda', 'cultura_viva']
        };
    }

    /**
     * Procesar mensaje del usuario con contexto conversacional
     */
    processMessage(userMessage, agentResponse) {
        // Guardar en historial
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        // Enriquecer respuesta del agente con contexto
        const enrichedResponse = this.enrichResponse(agentResponse, userMessage);

        this.conversationHistory.push({
            role: 'assistant',
            content: enrichedResponse,
            timestamp: new Date().toISOString()
        });

        // Actualizar contexto del usuario
        this.updateUserContext(userMessage, agentResponse.intent);

        return enrichedResponse;
    }

    /**
     * Enriquecer respuesta con elementos conversacionales
     */
    enrichResponse(agentResponse, userMessage) {
        let response = '';

        // 1. Saludo contextual (solo si es primera interacción)
        if (this.conversationHistory.length === 0) {
            response += this.getGreeting() + '\n\n';
        }

        // 2. Reconocimiento de la consulta
        response += this.acknowledgeQuery(userMessage, agentResponse.intent) + '\n\n';

        // 3. Respuesta principal del agente
        response += agentResponse.message;

        // 4. Sugerencias de seguimiento
        const followUp = this.generateFollowUp(agentResponse.intent);
        if (followUp) {
            response += '\n\n' + followUp;
        }

        // 5. Cierre conversacional
        if (this.shouldAddClosing(agentResponse.intent)) {
            response += '\n\n' + this.getClosing(agentResponse.intent);
        }

        return response;
    }

    /**
     * Saludo personalizado según hora del día
     */
    getGreeting() {
        const hour = new Date().getHours();
        let greeting = '';

        if (hour < 12) greeting = '¡Buenos días, explorador del tiempo!';
        else if (hour < 19) greeting = '¡Buenas tardes, caminante!';
        else greeting = '¡Buenas noches bajo las estrellas ancestrales!';

        return `${greeting} Soy el Guardián Digital del Upano. Te ayudaré a ver lo que la selva esconde. 🐆🏛️`;
    }

    /**
     * Reconocer la consulta del usuario
     */
    acknowledgeQuery(userMessage, intent) {
        const acknowledgments = {
            exploration: [
                'Entiendo que buscas recorrer los senderos antiguos.',
                'Perfecto, caminemos sobre la historia.',
                'Excelente elección. El valle tiene 2.500 años de secretos.'
            ],
            purchase: [
                'Cada objeto artesanal lleva la herencia de esta tierra.',
                'Apoyar a los creadores locales es mantener viva la memoria.',
                'Perfecto, te muestro los tesoros de nuestros artesanos.'
            ],
            bio_report: [
                '¡Un hallazgo valioso! La naturaleza te ha revelado algo.',
                'Registrando tu observación en los anales del proyecto.',
                'Excelente ojo. Cada dato nos ayuda a entender el ecosistema.'
            ],
            ar_station: [
                'Sincronizando con el pasado y el presente...',
                'Abriendo la ventana temporal de realidad aumentada.',
                'Veamos qué presencias revela el escáner.'
            ]
        };

        const options = acknowledgments[intent] || ['Entiendo tu consulta.'];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Generar sugerencias de seguimiento
     */
    generateFollowUp(intent) {
        const followUps = {
            exploration: '¿Te gustaría que te recomiende servicios de alojamiento cercanos o prefieres ver el mapa interactivo?',
            purchase: '¿Quieres conocer más sobre algún artesano en particular o ver otros productos?',
            bio_report: '¿Tomaste alguna foto? Podrías compartirla para validación de expertos.',
            ar_station: '¿Quieres activar la cámara AR para ver el "fantasma" del jaguar en 3D?'
        };

        return followUps[intent] || null;
    }

    /**
     * Determinar si agregar cierre conversacional
     */
    shouldAddClosing(intent) {
        // No agregar cierre si es una consulta que requiere acción inmediata
        return !['ar_station', 'purchase'].includes(intent);
    }

    /**
     * Cierre conversacional apropiado
     */
    getClosing(intent) {
        const closings = {
            exploration: 'Bajo esta vegetación, el Upano respira historia. ¡Camina con respeto! 🌿🏛️',
            bio_report: 'Tu aporte protege el legado natural. ¡Gracias por ser un Guardián del Jaguar! 💚',
            default: '¿Qué otro secreto del valle quieres descubrir?'
        };

        return closings[intent] || closings.default;
    }

    /**
     * Actualizar contexto del usuario
     */
    updateUserContext(userMessage, intent) {
        // Detectar intereses
        if (intent === 'exploration') {
            if (!this.userContext.interests.includes('ecoturismo')) {
                this.userContext.interests.push('ecoturismo');
            }
        }

        if (intent === 'purchase') {
            if (!this.userContext.interests.includes('artesanía')) {
                this.userContext.interests.push('artesanía');
            }
        }

        // Guardar consulta
        this.userContext.previousQueries.push({
            query: userMessage,
            intent: intent,
            timestamp: new Date().toISOString()
        });

        // Limitar historial a últimas 10 consultas
        if (this.userContext.previousQueries.length > 10) {
            this.userContext.previousQueries.shift();
        }
    }

    /**
     * Obtener contexto para personalización
     */
    getUserContext() {
        return {
            ...this.userContext,
            conversationLength: this.conversationHistory.length,
            isReturningUser: this.conversationHistory.length > 5
        };
    }

    /**
     * Detectar si el usuario está frustrado o confundido
     */
    detectSentiment(userMessage) {
        const frustrationKeywords = ['no entiendo', 'no funciona', 'error', 'mal', 'ayuda'];
        const isFrustrated = frustrationKeywords.some(keyword =>
            userMessage.toLowerCase().includes(keyword)
        );

        if (isFrustrated) {
            return 'frustrated';
        }

        const excitementKeywords = ['genial', 'increíble', 'wow', 'excelente', 'perfecto'];
        const isExcited = excitementKeywords.some(keyword =>
            userMessage.toLowerCase().includes(keyword)
        );

        if (isExcited) {
            return 'excited';
        }

        return 'neutral';
    }

    /**
     * Adaptar tono según sentimiento detectado
     */
    adaptTone(sentiment) {
        const toneAdaptations = {
            frustrated: {
                prefix: 'Entiendo tu frustración. ',
                approach: 'Déjame ayudarte paso a paso.'
            },
            excited: {
                prefix: '¡Me alegra tu entusiasmo! ',
                approach: 'Vamos a aprovechar esa energía.'
            },
            neutral: {
                prefix: '',
                approach: ''
            }
        };

        return toneAdaptations[sentiment] || toneAdaptations.neutral;
    }

    /**
     * Limpiar historial (para nueva sesión)
     */
    reset() {
        this.conversationHistory = [];
        this.userContext.previousQueries = [];
    }
}

export const conversationManager = new ConversationManager();
