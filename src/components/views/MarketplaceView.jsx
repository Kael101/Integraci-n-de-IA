import React, { useState } from 'react';
import { Search, ShoppingBag, Filter, Star, Heart, ArrowRight } from 'lucide-react';
import JIcon from '../ui/JIcon';

const MarketplaceView = () => {
    const [activeCategory, setActiveCategory] = useState('Todos');

    // Categorías de filtro
    const categories = ['Todos', 'Gastronomía', 'Artesanía', 'Equipo', 'Tours'];

    // DATOS SIMULADOS (Aquí brillan tus productos)
    const products = [
        {
            id: 1,
            name: "Jungle Protein Bites",
            producer: "Nutrición Amazónica",
            category: "Gastronomía",
            price: 12.50,
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1599599810653-98fe80fa464e?q=80&w=800&auto=format&fit=crop", // Foto placeholder de snack/bowl
            isNew: true,
            tag: "Superalimento"
        },
        {
            id: 2,
            name: "Collar Étnico Shuar",
            producer: "Asoc. Mujeres Artesanas",
            category: "Artesanía",
            price: 25.00,
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=800&auto=format&fit=crop",
            isNew: false
        },
        {
            id: 3,
            name: "Chocolate 85% Macas",
            producer: "Finca El Origen",
            category: "Gastronomía",
            price: 8.00,
            rating: 5.0,
            image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=800&auto=format&fit=crop",
            isNew: false
        },
        {
            id: 4,
            name: "Miel de Abeja Melipona",
            producer: "Apiario Selva Viva",
            category: "Gastronomía",
            price: 15.00,
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1587049359509-b788043263e8?q=80&w=800&auto=format&fit=crop",
            isNew: false
        }
    ];

    return (
        <div className="min-h-screen bg-jaguar-950 pb-32 animate-fade-in overflow-y-auto">

            {/* 1. HEADER FIJO */}
            <div className="sticky top-0 z-20 bg-jaguar-950/95 backdrop-blur-md border-b border-white/5 px-6 pt-12 pb-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="font-display font-bold text-2xl text-white">Mercado</h1>
                        <p className="text-jaguar-400 text-xs tracking-widest uppercase">Tesoros de Morona Santiago</p>
                    </div>
                    <button className="relative p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ShoppingBag className="text-white" size={20} />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-jaguar-500 rounded-full border-2 border-jaguar-950"></span>
                    </button>
                </div>

                {/* Barra de Búsqueda */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar snacks, artesanías..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-jaguar-500/50 transition-colors placeholder:text-white/20 font-body"
                    />
                </div>

                {/* Filtros de Categoría (Scroll horizontal) */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${activeCategory === cat
                                    ? 'bg-jaguar-500 text-jaguar-950'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. BANNER PROMOCIONAL (Tu Negocio) */}
            <div className="px-6 mt-6 mb-2">
                <div className="relative rounded-2xl overflow-hidden h-40 bg-gradient-to-r from-jaguar-900 to-jaguar-800 border border-jaguar-500/30 flex items-center shadow-lg shadow-jaguar-900/50">
                    <div className="absolute right-0 top-0 w-1/2 h-full">
                        <img src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 mix-blend-overlay" alt="Chef" />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-jaguar-900"></div>
                    </div>
                    <div className="relative z-10 p-6 w-2/3">
                        <span className="bg-jaguar-500 text-jaguar-950 text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">NUEVO LOTE</span>
                        <h3 className="font-display font-bold text-lg text-white leading-tight mb-2">Jungle Protein Bites</h3>
                        <button className="flex items-center gap-1 text-jaguar-400 text-xs font-bold hover:text-white transition-colors">
                            Ver detalles <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. CONTENIDO PRINCIPAL (Grid de Productos) */}
            <div className="p-6 grid grid-cols-2 gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

        </div>
    );
};

// --- SUB-COMPONENTE: TARJETA DE PRODUCTO ---
const ProductCard = ({ product }) => (
    <div className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-jaguar-500/30 transition-all duration-300">
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden">
            <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Botón Favorito Flotante */}
            <button className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white/70 hover:text-red-400 hover:bg-white transition-colors">
                <Heart size={14} />
            </button>
            {/* Etiqueta si es nuevo */}
            {product.isNew && (
                <span className="absolute top-2 left-2 bg-jaguar-500 text-jaguar-950 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                    NUEVO
                </span>
            )}
        </div>

        {/* Info */}
        <div className="p-3">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] text-white/40 uppercase tracking-wider block mb-0.5 truncate pr-2">
                    {product.producer}
                </span>
                <div className="flex items-center gap-0.5 bg-white/5 px-1 rounded">
                    <Star size={8} className="text-jaguar-500 fill-jaguar-500" />
                    <span className="text-[9px] text-white font-bold">{product.rating}</span>
                </div>
            </div>

            <h3 className="font-display font-bold text-sm text-white leading-snug mb-2 line-clamp-2 min-h-[2.5em]">
                {product.name}
            </h3>

            <div className="flex justify-between items-center">
                <span className="font-body font-semibold text-jaguar-400">
                    ${product.price.toFixed(2)}
                </span>
                <button className="p-1.5 bg-white text-jaguar-950 rounded-lg hover:bg-jaguar-500 transition-colors shadow-lg active:scale-90">
                    <ShoppingBag size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    </div>
);

export default MarketplaceView;
