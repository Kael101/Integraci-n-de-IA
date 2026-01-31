import React from 'react';
import { MapPin } from 'lucide-react'; // Iconos temporales
import logoJaguar from '../../assets/logo_territorio_jaguar.png';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-jungle-gradient overflow-hidden">

            {/* 1. Efecto de fondo (Círculos de luz ambiental) */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-jaguar-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-jaguar-500/5 rounded-full blur-[100px]" />

            {/* 2. Contenedor Central con Glassmorphism suave */}
            <div className="relative flex flex-col items-center animate-bounce-slow">

                {/* LOGO SIMULADO (Reemplazar con tu SVG <img /> luego) */}
                <div className="relative mb-6 p-4">
                    {/* Un anillo giratorio simulando "escaneo" */}
                    <div className="absolute inset-0 border-t-2 border-jaguar-500 rounded-full animate-spin blur-[1px] opacity-70"></div>

                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-full border border-white/10 shadow-2xl shadow-jaguar-900/50">
                        <img
                            src={logoJaguar}
                            alt="Territorio Jaguar Logo"
                            className="w-24 h-auto object-contain drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                        />
                    </div>
                </div>

                {/* 3. Tipografía de Marca */}
                <h1 className="font-display font-bold text-3xl tracking-[0.2em] text-white uppercase text-center mb-2">
                    Territorio <span className="text-jaguar-500">Jaguar</span>
                </h1>

                {/* 4. Micro-copy "UX Writing" */}
                <p className="font-body text-jaguar-400 text-sm tracking-wide animate-pulse mt-4">
                    SINCRONIZANDO ECOSISTEMA...
                </p>

            </div>

            {/* Footer minimalista */}
            <div className="absolute bottom-8 text-white/20 text-xs font-display tracking-widest">
                MORONA SANTIAGO // ECUADOR
            </div>
        </div>
    );
};

export default SplashScreen;
