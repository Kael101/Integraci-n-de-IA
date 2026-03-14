// src/components/AgentChatDemo.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Bot, Shield, Mic, MicOff, Volume2, X } from 'lucide-react';
import { orchestrator } from '../agents/orchestrator';
import { useVoice } from '../hooks/useVoice';

/**
 * DEMO: Interfaz de Chat con Sistema Multi-Agente
 * Permite probar las consultas procesadas por el Orquestador
 */
const AgentChatDemo = () => {
    const [isOpen, setIsOpen] = useState(false);
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
        <>
            {/* Botón Flotante (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 bottom-[6.5rem] right-6 md:bottom-28 md:right-8 w-14 h-14 bg-jaguar-500 rounded-full flex items-center justify-center text-jaguar-950 shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
            >
                <Bot size={28} />
            </button>

            {/* Chat Sidebar/BottomSheet */}
            <div className={`fixed z-[100] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOpen 
                ? 'inset-x-0 bottom-0 h-[80vh] md:h-screen md:w-[400px] md:bottom-auto md:top-0 md:right-0 opacity-100 translate-y-0 md:translate-x-0' 
                : 'inset-x-0 bottom-0 h-[80vh] translate-y-full md:h-screen md:w-[400px] md:bottom-auto md:top-0 md:right-0 md:translate-x-full opacity-0 pointer-events-none'
            } bg-jaguar-950/95 md:bg-jaguar-950/80 backdrop-blur-2xl md:border-l border-t md:border-t-0 border-white/10 flex flex-col shadow-2xl rounded-t-3xl md:rounded-none`}>
                
                {/* Header */}
                <div className="bg-transparent border-b border-jaguar-500/20 p-4 flex flex-col md:flex-row items-center justify-between gap-3 relative">
                    {/* Pull bar for mobile */}
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mb-2 md:hidden cursor-pointer" onClick={() => setIsOpen(false)}></div>
                    
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-jaguar-500/20 flex items-center justify-center border border-jaguar-500/30">
                                <Bot className="text-jaguar-500" size={20} />
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-white leading-tight">Conserje IA</h2>
                                <p className="text-[10px] tracking-wide text-jaguar-400">Sis. Multi-Agente MCP</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors hidden md:block">
                            <X size={18} />
                        </button>
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
        </>
    );
};

export default AgentChatDemo;
