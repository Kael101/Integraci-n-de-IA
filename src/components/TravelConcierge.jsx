import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';

const TravelConcierge = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "¡Hola! Soy el Concierge Jaguar. ¿En qué puedo ayudarte hoy en tu viaje por Morona Santiago?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now(),
            type: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Response based on keywords
        setTimeout(() => {
            let botResponse = {
                id: Date.now() + 1,
                type: 'bot',
                text: "Entiendo. Estoy procesando tu solicitud para proteger la selva...",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const lowerInput = input.toLowerCase();
            if (lowerInput.includes('expedición') || lowerInput.includes('viaje')) {
                botResponse.text = "¡Excelente elección! Las Expediciones Guardián te permiten ver el trabajo de IA en tiempo real. Te sugiero la 'Expedición Guardián' en el Valle del Upano. ¿Te gustaría ver la ubicación en el mapa?";
                botResponse.card = {
                    title: "Expedición Guardián",
                    location: "Valle del Upano",
                    price: "$120.00",
                    impact: "Sostiene el Kit de un nuevo Guardián"
                };
            } else if (lowerInput.includes('producto') || lowerInput.includes('comprar')) {
                botResponse.text = "Nuestros productos son bio-certificados. La Mochila Shuar 'Ayamtai' es nuestra favorita actual. ¿Quieres ver más detalles?";
            } else {
                botResponse.text = "Como tu Concierge Jaguar, puedo ayudarte a planificar expediciones, rastrear el bio-impacto de tus compras o simplemente contarte más sobre los jaguares de Morona Santiago.";
            }

            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[400px] h-[600px] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 p-6 flex justify-between items-center text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/30">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg tracking-tight leading-none">Concierge Jaguar</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">En línea</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${msg.type === 'user' ? 'bg-slate-900 text-white' : 'bg-green-100 text-green-700'}`}>
                                {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className="space-y-2">
                                <div className={`px-5 py-3.5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${msg.type === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                                {msg.card && (
                                    <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-xl shadow-green-900/5 mt-3 animate-in zoom-in-95 duration-500">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-green-500 p-2 rounded-xl text-white">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{msg.card.location}</span>
                                        </div>
                                        <h4 className="font-black text-slate-800 text-lg mb-1">{msg.card.title}</h4>
                                        <p className="text-xs text-green-600 font-bold mb-4">{msg.card.impact}</p>
                                        <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                                            <span className="text-xl font-black text-slate-900">{msg.card.price}</span>
                                            <button className="bg-slate-900 text-white p-2 rounded-xl hover:bg-green-600 transition-colors">
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <span className={`text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 items-center text-slate-400">
                        <div className="bg-green-50 w-8 h-8 rounded-xl flex items-center justify-center">
                            <Bot size={16} className="text-green-600" />
                        </div>
                        <div className="flex gap-1.5 px-3 py-2 bg-slate-50 rounded-2xl">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-50">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu mensaje..."
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500/20 focus:bg-white rounded-2xl py-4 pl-5 pr-14 text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-3 top-2 bottom-2 bg-green-600 text-white px-3 rounded-xl hover:bg-green-700 transition-all active:scale-90 flex items-center justify-center shadow-lg shadow-green-200 group-hover:px-4"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="mt-4 flex gap-2">
                    {['Explorar Expediciones', 'Bio-Impacto'].map((chip) => (
                        <button
                            key={chip}
                            onClick={() => setInput(chip)}
                            className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TravelConcierge;
