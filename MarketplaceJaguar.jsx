import React, { useState } from 'react';
import {
    ShoppingBag, MapPin, Truck, ShieldCheck, Heart,
    Info, ArrowRight, Package, Camera, Sparkles,
    Lock, LayoutDashboard, Globe
} from 'lucide-react';
import TravelConcierge from './src/components/TravelConcierge';
import MaintenanceDashboard from './src/components/MaintenanceDashboard';
import ProviderDashboard from './src/components/ProviderDashboard';

const MarketplaceJaguar = () => {
    const [view, setView] = useState('shop'); // 'shop' | 'product' | 'tracking'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isConciergeOpen, setIsConciergeOpen] = useState(false);
    const [appMode, setAppMode] = useState('market'); // 'market' | 'guardian' | 'provider'

    // Datos simulados de productos
    const products = [
        {
            id: 1,
            name: "Mochila Shuar 'Ayamtai'",
            artisan: "Rosa Chumpi",
            community: "Comunidad Arapicos",
            price: 45.00,
            impact: "Financia 20 horas de monitoreo de IA",
            image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400",
            description: "Tejida a mano con fibras naturales de la zona de amortiguamiento del Upano. Cada patrón cuenta una historia ancestral de respeto al felino.",
            stock: 5,
            impactLevel: 85
        },
        {
            id: 2,
            name: "Aceite Esencial de Selva",
            artisan: "Cooperativa BioUpano",
            community: "Sector Abanico",
            price: 18.50,
            impact: "Restaura 5m² de corredor biológico",
            image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400",
            description: "Destilado de plantas nativas recolectadas sin deforestación. Apoya la economía de las familias que cuidan el hábitat del jaguar.",
            stock: 12,
            impactLevel: 92
        },
        {
            id: 3,
            name: "Expedición Guardián (1 día)",
            artisan: "Guía Juan Tzamarenda",
            community: "Valle del Upano",
            price: 120.00,
            impact: "Sostiene el Kit de un nuevo Guardián",
            image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=400",
            description: "Acompaña a un guía certificado a revisar sensores de IA y reportar rastros. El 100% va al proyecto.",
            stock: 2,
            impactLevel: 100
        }
    ];

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setView('product');
    };

    const renderShop = () => (
        <div className="p-6 bg-slate-50 min-h-screen">
            <header className="mb-12 mt-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-600 p-2 rounded-xl text-white shadow-lg shadow-green-200">
                        <ShoppingBag size={24} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mercado Jaguar</h1>
                </div>
                <p className="text-xl text-slate-600 font-medium">Productos con alma que protegen la selva de Morona Santiago.</p>
                <div className="h-1 w-20 bg-green-500 mt-4 rounded-full"></div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {products.map(product => (
                    <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-green-100 transition-all duration-500 cursor-pointer border border-transparent hover:border-green-100 flex flex-col h-full transform hover:-translate-y-2"
                    >
                        <div className="relative h-72 overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-6 left-6 backdrop-blur-md bg-white/80 text-green-800 text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/50 shadow-sm">
                                <ShieldCheck size={14} className="text-green-600" /> BIO-CERTIFICADO
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors uppercase">{product.name}</h3>
                            </div>

                            <p className="text-sm text-slate-500 mb-6 flex items-center gap-2 font-medium">
                                <MapPin size={16} className="text-slate-400" /> {product.community}
                            </p>

                            <div className="mt-auto">
                                <div className="bg-green-50/50 p-4 rounded-3xl flex items-center gap-4 mb-6 border border-green-100/50">
                                    <div className="bg-green-500 p-3 rounded-2xl text-white shadow-md shadow-green-100">
                                        <Heart size={18} fill="currentColor" />
                                    </div>
                                    <div className="text-xs text-green-900 font-semibold leading-relaxed">
                                        <span className="block text-[10px] uppercase tracking-wider text-green-600 mb-0.5">Impacto Directo</span>
                                        {product.impact}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-3xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                                    <div className="bg-slate-900 text-white p-3 rounded-2xl group-hover:bg-green-600 transition-colors duration-300">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProductDetail = () => {
        if (!selectedProduct) {
            setView('shop');
            return null;
        }

        return (
            <div className="bg-white min-h-screen">
                <nav className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                    <button
                        onClick={() => setView('shop')}
                        className="group flex items-center gap-2 text-slate-600 hover:text-green-700 font-bold transition-colors"
                    >
                        <div className="p-2 group-hover:bg-green-50 rounded-full transition-colors">
                            <ArrowRight className="rotate-180" size={20} />
                        </div>
                        <span>Volver a la tienda</span>
                    </button>
                    <div className="bg-slate-100 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Explorando Producto
                    </div>
                </nav>

                <div className="flex flex-col lg:flex-row max-w-7xl mx-auto py-12 px-6 gap-16">
                    <div className="lg:w-1/2">
                        <div className="sticky top-28">
                            <div className="relative group">
                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="w-full rounded-[3rem] shadow-2xl shadow-slate-200 object-cover aspect-square transition-transform duration-700 hover:scale-[1.02]"
                                />
                                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 flex items-center gap-4">
                                    <div className="bg-green-600 p-3 rounded-2xl text-white">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Certificación</p>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">BIO-GARANTIZADO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 flex flex-col">
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-green-100 text-green-700 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">Artesanía de Conservación</span>
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Morona Santiago</span>
                            </div>
                            <h2 className="text-6xl font-black text-slate-900 leading-none mb-6 tracking-tighter">{selectedProduct.name}</h2>
                            <div className="flex items-baseline gap-4">
                                <p className="text-4xl text-slate-900 font-black tracking-tight">${selectedProduct.price.toFixed(2)}</p>
                                <p className="text-sm text-slate-400 font-medium line-through decoration-slate-300/50 decoration-2">${(selectedProduct.price * 1.2).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-200/50 shadow-inner">
                            <div className="w-16 h-16 bg-slate-300 rounded-3xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.artisan)}&background=1B4332&color=fff&bold=true`}
                                    alt={selectedProduct.artisan}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Creado con alma por:</p>
                                <p className="text-xl font-bold text-slate-800 tracking-tight">{selectedProduct.artisan}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <MapPin size={12} className="text-green-600" />
                                    <p className="text-xs text-slate-500 font-medium">{selectedProduct.community}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Info size={18} className="text-green-600" /> Historia del Proceso
                            </h4>
                            <div className="text-slate-600 leading-relaxed text-lg space-y-4">
                                <p>{selectedProduct.description}</p>
                                <div className="bg-slate-50 border-l-4 border-green-500 p-6 rounded-r-3xl italic text-sm">
                                    "Venta y Despacho: El producto se recolecta en la comunidad por un Guardián Jaguar y se transporta a Macas para control de calidad. El empaque es 100% biodegradable."
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white mb-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Camera size={120} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-black text-green-400 flex items-center gap-3 mb-6 text-sm uppercase tracking-widest">
                                    Bio-Impacto Real: {selectedProduct.impactLevel}%
                                </h4>
                                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-6 shadow-inner">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${selectedProduct.impactLevel}%` }}></div>
                                </div>
                                <p className="text-lg opacity-90 leading-relaxed font-medium italic">
                                    "{selectedProduct.impact}"
                                </p>
                                <p className="text-xs mt-4 text-slate-400 font-bold uppercase tracking-widest">Impacto verificado por Satélite e IA</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setView('tracking')}
                            className="w-full bg-green-700 hover:bg-green-600 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl shadow-green-200 active:scale-[0.98] group"
                        >
                            <ShoppingBag size={24} className="group-hover:bounce" />
                            <span className="text-xl">COMPRAR Y ACTIVAR IMPACTO</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTracking = () => {
        if (!selectedProduct) {
            setView('shop');
            return null;
        }

        return (
            <div className="bg-[#0f172a] min-h-screen p-6 text-white font-sans overflow-x-hidden">
                <nav className="mb-12 flex items-center justify-between max-w-2xl mx-auto">
                    <button
                        onClick={() => setView('product')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <div className="p-2 border border-slate-800 rounded-full">
                            <ArrowRight className="rotate-180" size={14} />
                        </div>
                        Volver
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Live Impact Tracking</span>
                    </div>
                </nav>

                <div className="max-w-2xl mx-auto">
                    <div className="relative mb-12">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-700/50 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full"></div>

                            <div className="flex justify-between items-center mb-10 pb-10 border-b border-slate-700/50">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Orden Confirmada</p>
                                    <h3 className="text-3xl font-black tracking-tighter">#TJ-89241</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Activación en</p>
                                    <p className="text-3xl font-black text-green-400 tracking-tighter">4-6 días</p>
                                </div>
                            </div>

                            {/* Stepper Logístico */}
                            <div className="relative space-y-12">
                                {/* Línea de fondo */}
                                <div className="absolute left-[1.125rem] top-2 bottom-2 w-0.5 bg-slate-700/50"></div>

                                {[
                                    { icon: <MapPin size={18} />, title: "Recolección en Comunidad", desc: `El guía Jaguar está recolectando tu ${selectedProduct.name} en ${selectedProduct.community}.`, time: "Hoy, 09:15 AM", active: true },
                                    { icon: <Truck size={18} />, title: "Tránsito al Centro de Control", desc: "Consolidación en Macas (Control de Calidad y Etiquetado NFC Bio-Secure).", time: "Pendiente", active: false },
                                    { icon: <Package size={18} />, title: "Despacho Sostenible", desc: "Salida vía Courier especializado con empaque 100% compostable.", time: "Pendiente", active: false },
                                    { icon: <Camera size={18} />, title: "Activación del Guardián", desc: "Recibirás coordenadas satelitales del sensor de IA que activaste con tu compra.", time: "Pendiente", active: false }
                                ].map((step, i) => (
                                    <div key={i} className={`relative flex items-start gap-8 transition-opacity duration-500 ${step.active ? 'opacity-100' : 'opacity-30'}`}>
                                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center z-10 shrink-0 shadow-lg ${step.active ? 'bg-green-500 text-slate-900' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            {step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-lg font-black tracking-tight ${step.active ? 'text-white' : 'text-slate-500'}`}>{step.title}</h4>
                                            <p className="text-sm text-slate-400 mt-1 font-medium leading-relaxed">{step.desc}</p>
                                            {step.active && <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-3 bg-green-500/10 inline-block px-2 py-1 rounded-md">En curso</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-500 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-green-500/20 group hover:scale-[1.02] transition-transform duration-500">
                        <div className="flex items-center gap-6">
                            <div className="bg-slate-900 p-4 rounded-[1.5rem] text-green-400 shadow-xl">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest mb-1 opacity-60">Seguridad Jaguar</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight">Bio-Contrato Asegurado</p>
                            </div>
                        </div>
                        <button className="bg-white text-slate-900 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg group-hover:px-8">
                            Ver NFT
                        </button>
                    </div>
                </div>

                <div className="mt-16 text-center text-slate-600">
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Mercado Jaguar © 2024</p>
                    <p className="text-[8px] mt-2 opacity-50">Tecnología para la vida · Morona Santiago, Ecuador</p>
                </div>
            </div>
        );
    };

    return (
        <div className="font-sans antialiased text-slate-900 selection:bg-green-100">
            {/* Top Navigation Bar for Mode Switching */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                        <Globe size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Territorio Jaguar</span>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setAppMode('market')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${appMode === 'market' ? 'bg-white text-green-700 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShoppingBag size={14} /> Mercado
                    </button>
                    <button
                        onClick={() => setAppMode('provider')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${appMode === 'provider' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutDashboard size={14} /> Proveedor
                    </button>
                    <button
                        onClick={() => setAppMode('guardian')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${appMode === 'guardian' ? 'bg-slate-900 text-emerald-400 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Lock size={14} className={appMode === 'guardian' ? 'text-emerald-400' : ''} /> Guardian
                    </button>
                </div>
            </div>

            {appMode === 'guardian' ? (
                <MaintenanceDashboard />
            ) : appMode === 'provider' ? (
                <ProviderDashboard />
            ) : (
                <>
                    {view === 'shop' && renderShop()}
                    {view === 'product' && renderProductDetail()}
                    {view === 'tracking' && renderTracking()}
                </>
            )}

            {/* Concierge Trigger FAB - Hide in Guardian/Provider Mode for focus */}
            {appMode === 'market' && (
                <button
                    onClick={() => setIsConciergeOpen(true)}
                    className="fixed bottom-8 right-8 z-40 bg-gradient-to-br from-green-600 to-emerald-700 text-white p-5 rounded-[2rem] shadow-2xl shadow-green-900/20 hover:scale-110 hover:-rotate-6 transition-all duration-500 group border border-white/20"
                >
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-[10px] font-black text-slate-900 px-2 py-1 rounded-lg animate-bounce uppercase tracking-tighter">
                        AI Concierge
                    </div>
                    <Sparkles size={28} className="group-hover:animate-pulse" />
                </button>
            )}

            <TravelConcierge
                isOpen={isConciergeOpen}
                onClose={() => setIsConciergeOpen(false)}
            />
        </div>
    );
};


export default MarketplaceJaguar;

