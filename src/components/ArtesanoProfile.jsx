import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Share2, Clock, Award, Hammer, Users, ArrowLeft } from 'lucide-react';
import artisansData from '../data/artisans.json';

const ArtesanoProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);

    useEffect(() => {
        // Simulate data fetching or use mock data directly
        const found = artisansData.find(a => a.id === id) || artisansData[0]; // Fallback purely for dev
        setArtisan(found);
    }, [id]);

    if (!artisan) return <div className="text-white text-center p-10">Cargando perfil...</div>;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Territorio Jaguar: ${artisan.name}`,
                text: `Descubre la historia de ${artisan.name}, ${artisan.title}.`,
                url: window.location.href,
            });
        }
    };

    const handleNavigateToMap = () => {
        navigate('/', { state: { centerOn: artisan.coordinates, artisanId: artisan.id } });
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white pb-20 overflow-x-hidden">

            {/* 1. Cabecera Visual (El "Gancho") */}
            <div className="relative h-72 w-full">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-20 p-2 bg-black/40 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
                >
                    <ArrowLeft size={24} className="text-white" />
                </button>

                <img
                    src={artisan.cover_image}
                    alt="Cover"
                    className="w-full h-full object-cover rounded-b-[2.5rem] shadow-2xl brightness-75"
                />

                <div className="absolute -bottom-16 left-0 right-0 flex justify-center z-10">
                    <div className="relative">
                        <img
                            src={artisan.profile_image}
                            alt={artisan.name}
                            className="w-32 h-32 rounded-full border-4 border-neutral-900 shadow-xl object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-amber-500 text-black p-1.5 rounded-full shadow-lg border-2 border-neutral-900" title="Verificado por la Junta Nacional">
                            <Award size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="mt-20 px-6 text-center">
                <h1 className="text-3xl font-bold font-serif tracking-tight">{artisan.name}</h1>
                <p className="text-amber-500 font-medium uppercase text-xs tracking-widest mt-1 mb-4">{artisan.title}</p>

                <div className="flex justify-center gap-2 flex-wrap">
                    <span className="bg-neutral-800 px-3 py-1 rounded-full text-xs text-neutral-400 border border-neutral-700">
                        {artisan.category}
                    </span>
                    {artisan.languages.map(lang => (
                        <span key={lang} className="bg-neutral-800 px-3 py-1 rounded-full text-xs text-neutral-400 border border-neutral-700">
                            {lang}
                        </span>
                    ))}
                </div>
            </div>

            {/* 2. Botones de Acción Rápida (Supervivencia) */}
            <div className="flex justify-center gap-4 mt-8 px-6">
                <button
                    onClick={handleNavigateToMap}
                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 active:scale-95 transition-transform hover:bg-neutral-800/80 group">
                    <div className="bg-amber-500/10 p-3 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                        <MapPin className="text-amber-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">Llévame</span>
                </button>

                <button
                    onClick={() => window.open(`https://wa.me/${artisan.phone}`, '_blank')}
                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 active:scale-95 transition-transform hover:bg-neutral-800/80 group">
                    <div className="bg-green-500/10 p-3 rounded-xl group-hover:bg-green-500/20 transition-colors">
                        <MessageCircle className="text-green-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">WhatsApp</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 active:scale-95 transition-transform hover:bg-neutral-800/80 group">
                    <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <Share2 className="text-blue-500" size={24} />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">Compartir</span>
                </button>
            </div>

            {/* 3. Storytelling (El Legado) */}
            <div className="mt-10 px-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users size={20} className="text-amber-500" />
                    <h2 className="text-xl font-bold">Mi Legado</h2>
                </div>
                <div className="bg-neutral-800/30 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-neutral-300 leading-relaxed text-sm">
                        {artisan.bio_legacy}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Mentor:</span>
                        <span className="text-sm text-neutral-200 font-serif italic">{artisan.mentor}</span>
                    </div>
                </div>
            </div>

            {/* Materials Tags */}
            <div className="mt-6 px-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-full border border-neutral-700 whitespace-nowrap">
                        <Hammer size={14} className="text-amber-500" />
                        <span className="text-xs font-medium text-neutral-300">Materiales:</span>
                    </div>
                    {artisan.materials.map(mat => (
                        <span key={mat} className="px-3 py-1.5 bg-neutral-800/50 rounded-full border border-neutral-700/50 text-xs text-neutral-400 whitespace-nowrap">
                            #{mat.replace(" ", "")}
                        </span>
                    ))}
                </div>
            </div>


            {/* Gallery Carousel */}
            <div className="mt-8 pl-6">
                <h2 className="text-xl font-bold mb-4">Obras Maestras</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 pr-6 snap-x snap-mandatory no-scrollbar">
                    {artisan.gallery_images.map((img, idx) => (
                        <div key={idx} className="min-w-[200px] h-[280px] snap-center relative rounded-2xl overflow-hidden shadow-lg group">
                            <img src={img} alt={`Obra ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
                                <span className="text-xs text-white/90">Pieza única</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Vivential Tourism Info */}
            <div className="mt-6 mx-6 p-5 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-white">Visita el Taller</h3>
                        <div className="flex items-center gap-2 mt-2 text-neutral-400 text-sm">
                            <Clock size={16} />
                            <span>{artisan.hours}</span>
                        </div>
                    </div>
                    {artisan.has_experience && (
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20 animate-pulse-slow">
                            <Users size={24} className="text-black" />
                            <span className="text-[10px] font-bold text-black uppercase mt-1">Live</span>
                        </div>
                    )}
                </div>

                {artisan.has_experience && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-amber-200/80">
                            ★ Este artesano ofrece demostraciones en vivo. Ideal para investigadores y turistas culturales.
                        </p>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                    <div>
                        <span className="block text-neutral-600 uppercase tracking-wider">Cerca de</span>
                        <span className="text-neutral-300 font-medium">{artisan.nearby_poi}</span>
                    </div>
                    <div>
                        <span className="block text-neutral-600 uppercase tracking-wider text-right">Pagos</span>
                        <span className="text-neutral-300 font-medium flex items-center justify-end gap-1">
                            {artisan.accepts_card ? "Efectivo / Tarjeta" : "Solo Efectivo"}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ArtesanoProfile;
