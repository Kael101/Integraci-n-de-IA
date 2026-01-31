import React, { useState, useEffect } from 'react';
import { useGreeting } from '../../hooks/useGreeting';
import { Apple, Play, ArrowRight, Shield, Scan, Battery, Instagram, Phone, Globe } from 'lucide-react';
import JIcon from '../ui/JIcon'; // Asumiendo que existe, sino usaré iconos directos
import logoJaguar from '../../assets/logo_territorio_jaguar.png';

const LandingPage = ({ onEnter }) => {
    const [isVisible, setIsVisible] = useState(false);
    const greeting = useGreeting();

    useEffect(() => {
        // Animación de entrada
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-jaguar-950 flex flex-col justify-between overflow-x-hidden text-white font-body relative">

            {/* BACKGROUND DECORATION */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-jaguar-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-jaguar-800/20 rounded-full blur-[80px] pointer-events-none" />

            {/* 1. ENCABEZADO (Saludo y Logo) */}
            <header className={`pt-8 px-6 flex justify-between items-start transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div>
                    <p className="text-jaguar-400 font-display tracking-widest text-xs uppercase mb-2">
                        {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-white leading-tight max-w-md">
                        {greeting}
                    </h2>
                </div>
                <img src={logoJaguar} alt="Territorio Jaguar" className="w-16 h-auto object-contain drop-shadow-lg opacity-90" />
            </header>

            {/* 2. HERO SECTION */}
            <section className={`flex-1 flex flex-col justify-center px-6 py-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="mb-2">
                    <span className="inline-block px-3 py-1 bg-jaguar-500/20 border border-jaguar-500/30 rounded-full text-jaguar-400 text-[10px] font-bold tracking-wider uppercase mb-4">
                        Acceso Anticipado
                    </span>
                </div>

                <div className="mb-6 flex justify-start">
                    <img src={logoJaguar} alt="Territorio Jaguar Logo" className="w-32 md:w-48 h-auto object-contain drop-shadow-[0_0_20px_rgba(197,160,89,0.3)]" />
                </div>

                <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white mb-2 tracking-tight">
                    Territorio <br />
                    <span className="text-jaguar-500">Jaguar</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/80 font-light italic mb-6">
                    La selva, decodificada.
                </p>

                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg mb-8">
                    Navegación táctica offline y el secreto de la civilización perdida del Upano.
                    Todo en la palma de tu mano.
                </p>

                {/* BOTONES DE DESCARGA */}
                <div className="space-y-3 max-w-md">
                    {/* App Store (Mock) */}
                    <button className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl p-4 transition-all group">
                        <Apple className="text-white w-6 h-6" />
                        <div className="text-left">
                            <span className="block text-[10px] text-white/60 uppercase tracking-wide">Descargar en</span>
                            <span className="block text-sm font-bold text-white group-hover:text-jaguar-400 transition-colors">App Store</span>
                        </div>
                    </button>

                    {/* Play Store (Mock) */}
                    <button className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl p-4 transition-all group">
                        <Play className="text-white w-6 h-6 fill-current" />
                        <div className="text-left">
                            <span className="block text-[10px] text-white/60 uppercase tracking-wide">Disponible en</span>
                            <span className="block text-sm font-bold text-white group-hover:text-jaguar-400 transition-colors">Google Play</span>
                        </div>
                    </button>

                    {/* MICRO COPY - GUARDIAN */}
                    <p className="text-[10px] text-center text-jaguar-400/80 mt-2">
                        "Por ser portador de esta tarjeta, tienes acceso prioritario a la Capa Arqueológica LiDAR."
                    </p>
                </div>

                {/* ACCESO WEB (Botón secundario para la demo) */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onEnter}
                        className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
                    >
                        <span>Ingresar a la versión Web (Demo)</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* 3. LOS TRES PILARES */}
            <section className={`px-6 pb-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pilar 1 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                        <div className="bg-jaguar-500/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                            <Shield size={16} className="text-jaguar-400" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm mb-1">Seguridad de Élite</h3>
                        <p className="text-white/50 text-xs leading-relaxed">Mapas topográficos que funcionan donde el Wi-Fi muere.</p>
                    </div>

                    {/* Pilar 2 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                        <div className="bg-jaguar-500/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                            <Scan size={16} className="text-jaguar-400" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm mb-1">Visión LiDAR</h3>
                        <p className="text-white/50 text-xs leading-relaxed">Descubre la ciudad perdida de hace 2.500 años mientras caminas.</p>
                    </div>

                    {/* Pilar 3 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                        <div className="bg-jaguar-500/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                            <Battery size={16} className="text-jaguar-400" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm mb-1">Jungle Protein</h3>
                        <p className="text-white/50 text-xs leading-relaxed">El combustible ancestral para tu expedición.</p>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER */}
            <footer className="px-6 pb-6 text-center border-t border-white/5 pt-6">
                <p className="text-jaguar-400 text-xs font-bold uppercase tracking-widest mb-4">
                    Sigue el rastro del Jaguar
                </p>

                <div className="flex justify-center gap-6 mb-6">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        <Instagram size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        <Globe size={18} /> {/* TikTok fallback */}
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        <Phone size={18} /> {/* WhatsApp fallback */}
                    </button>
                </div>

                <p className="text-[10px] text-white/30 max-w-xs mx-auto leading-relaxed">
                    Estás entrando en territorio sagrado. Camina con respeto.<br />
                    © 2026 Territorio Jaguar - Macas, Morona Santiago.
                </p>
            </footer>

        </div>
    );
};

export default LandingPage;
