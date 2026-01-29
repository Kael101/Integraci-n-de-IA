// src/components/AgentChatDemo.jsx
import React, { useState } from 'react';
import { MessageCircle, Send, Bot, Shield, Mic, MicOff, Volume2 } from 'lucide-react';
import { orchestrator } from '../agents/orchestrator';
import { useVoice } from '../hooks/useVoice';

/**
 * DEMO: Interfaz de Chat con Sistema Multi-Agente
 * Permite probar las consultas procesadas por el Orquestador
 */
const AgentChatDemo = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '¡Hola! Soy el Orquestador de Territorio Jaguar. Puedo ayudarte a explorar rutas, comprar artesanías o registrar avistamientos. ¿Qué necesitas?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { isListening, transcript, speak, startListening, stopListening, hasSupport } = useVoice();

    // Efecto: Cuando hay trancripción final, enviarla automáticamente
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
            handleSend(transcript); // Enviar directo al terminar de hablar
        }
    }, [transcript]);

    // Sobrecarga de handleSend para admitir argumento opcional (voz)
    const handleSend = async (textOverride = null) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;
        if (!textToSend.trim()) return;

        // Agregar mensaje del usuario
        const userMessage = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Procesar con el Orquestador
            const context = {
                location: { lng: -78.1186, lat: -2.3087 },
                userLevel: 'bronze'
            };

            const response = await orchestrator.processQuery(textToSend, context);

            // Agregar respuesta del agente
            const assistantMessage = {
                role: 'assistant',
                content: response.message,
                metadata: {
                    intent: response.intent,
                    safety: response.safety
                }
            };

            setMessages(prev => [...prev, assistantMessage]);

            // 🔊 RESPUESTA DE VOZ
            speak(response.message);

        } catch (error) {
            console.error('Error processing query:', error);
            const errorMsg = 'Ocurrió un error. Por favor intenta nuevamente.';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMsg
            }]);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const quickQueries = [
        "¿Dónde puedo ver jaguares?",
        "Quiero comprar artesanía Shuar",
        "Vi una huella en el sendero",
        "¿Qué servicios hay en Sevilla Don Bosco?"
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-jaguar-950 flex flex-col">
            {/* Header */}
            <div className="bg-jaguar-900 border-b border-jaguar-500/30 p-4 flex items-center gap-3">
                <Bot className="text-jaguar-500" size={24} />
                <div>
                    <h2 className="font-display font-bold text-white">Sistema Multi-Agente MCP</h2>
                    <p className="text-xs text-white/50">Orquestador + 3 Agentes Especialistas</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                            ? 'bg-jaguar-500 text-jaguar-950'
                            : 'bg-white/10 text-white border border-white/10'
                            }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            {msg.metadata?.safety?.blocked && (
                                <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                                    <Shield size={12} />
                                    <span>Ruta bloqueada por seguridad</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-jaguar-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-jaguar-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-jaguar-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Queries */}
            <div className="p-4 border-t border-white/10">
                <p className="text-xs text-white/50 mb-2">Consultas rápidas:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {quickQueries.map((query, idx) => (
                        <button
                            key={idx}
                            onClick={() => setInput(query)}
                            className="shrink-0 bg-white/5 hover:bg-white/10 text-white text-xs px-3 py-2 rounded-full border border-white/10 transition-colors"
                        >
                            {query}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-jaguar-900 border-t border-jaguar-500/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu consulta..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-jaguar-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-jaguar-500 hover:bg-jaguar-400 disabled:opacity-50 text-jaguar-950 p-3 rounded-xl transition-colors"
                    >
                        <Send size={20} />
                    </button>

                    {/* Botón de Micrófono */}
                    {hasSupport && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-3 rounded-xl transition-all ${isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentChatDemo;
