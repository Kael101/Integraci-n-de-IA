import React, { useState } from 'react';
import { ShoppingBag, MapPin, Truck, ShieldCheck, Heart, Info, ArrowRight, Package, Camera } from 'lucide-react';

const MarketplaceJaguar = () => {
    const [view, setView] = useState('shop'); // 'shop' | 'product' | 'tracking'
    const [selectedProduct, setSelectedProduct] = useState(null);

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
    <div className="p-4 bg-slate-50 min-h-screen">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-slate-900">Mercado Jaguar</h1>
        <p className="text-slate-600">Productos con alma que protegen la selva de Morona Santiago.</p>
      </header>mg src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> BIO-CERTIFICADO
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                <span className="text-green-700 font-bold">${product.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                <MapPin size={14} /> {product.community}
              </p>
              <div className="bg-green-50 p-3 rounded-xl flex items-center gap-3">
                <div className="bg-green-200 p-2 rounded-lg text-green-700">
                  <Heart size={16} fill="currentColor" />
                </div>
                <div className="text-xs text-green-800 font-medium leading-tight">
                  <span className="block font-bold">IMPACTO DIRECTO:</span>
                  {product.impact}
                </div>
              </div>
            </div>
          </div >
        ))}
      </div >
    </div >
  );

const renderProductDetail = () => {
    if (!selectedProduct) {
        setView('shop');
        return null;
    }

    return (
        <div className="bg-white min-h-screen">
            <nav className="p-4 border-b flex items-center gap-4">
                <button onClick={() => setView('shop')} className="p-2 hover:bg-slate-100 rounded-full" aria-label="Volver a la tienda">
                    <ArrowRight className="rotate-180" />
                </button>
                <span className="font-bold">Detalle del Producto</span>
            </nav>

            <div className="flex flex-col md:flex-row p-6 gap-8">
                <div className="md:w-1/2">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full rounded-3xl shadow-lg" />
                </div>

                <div className="md:w-1/2">
                    <div className="mb-6">
                        <span className="text-green-600 font-bold text-sm tracking-widest uppercase">Artesanía de Conservación</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-2">{selectedProduct.name}</h2>
                        <p className="text-2xl text-slate-700 mt-2 font-light">${selectedProduct.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.artisan)}&background=1B4332&color=fff`} alt={selectedProduct.artisan} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 italic">Creado por:</p>
                            <p className="font-bold text-slate-800">{selectedProduct.artisan}</p>
                            <p className="text-xs text-slate-400">Desde {selectedProduct.community}, Morona Santiago</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Info size={18} /> Historia del Proceso
                        </h4>
                        <div className="text-slate-600 leading-relaxed">
                            <p>{selectedProduct.description}</p>
                            <br />
                            <p><strong>Venta y Despacho:</strong> El producto se recolecta en la comunidad por un Guardián Jaguar y se transporta a Macas para control de calidad. El empaque es 100% biodegradable.</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-3xl text-white mb-8">
                        <h4 className="font-bold text-green-400 flex items-center gap-2 mb-4">
                            Puntuación de Bio-Impacto: {selectedProduct.impactLevel}%
                        </h4>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={selectedProduct.impactLevel} aria-valuemin="0" aria-valuemax="100">
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${selectedProduct.impactLevel}%` }}></div>
                        </div>
                        <p className="text-sm opacity-80 leading-snug italic">
                            "Esta compra financia directamente el mantenimiento de los sensores de IA en el corredor del Upano y garantiza un pago justo por encima del mercado local al productor."
                        </p>
                    </div>

                    <button
                        onClick={() => setView('tracking')}
                        className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-200"
                    >
                        <ShoppingBag size={20} /> Comprar y Seguir Impacto
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
        <div className="bg-slate-50 min-h-screen p-6">
            <nav className="mb-8 flex items-center gap-4">
                <button onClick={() => setView('product')} className="p-2 hover:bg-slate-200 rounded-full" aria-label="Volver al producto">
                    <ArrowRight className="rotate-180" />
                </button>
                <span className="font-bold text-xl">Seguimiento de Tu Impacto</span>
            </nav>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl p-8 shadow-sm border mb-6">
                    <div className="flex justify-between items-center mb-8 pb-8 border-b">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Orden: #TJ-89241</p>
                            <h3 className="text-lg font-bold">Estado: En Recolección</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Estimado</p>
                            <p className="font-bold text-green-600">4-6 días</p>
                        </div>
                    </div>

                    {/* Stepper Logístico */}
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100"></div>

                        <div className="relative flex items-start gap-6 mb-10">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center z-10 text-white shadow-sm shadow-green-200">
                                <MapPin size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800">Recolección en Comunidad</p>
                                <p className="text-sm text-slate-500">El guía asignado está recolectando tu producto en {selectedProduct.community}.</p>
                                <p className="text-xs text-slate-400 mt-1">Hoy, 09:15 AM</p>
                            </div>
                        </div>

                        <div className="relative flex items-start gap-6 mb-10">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center z-10 text-slate-400">
                                <Truck size={16} />
                            </div>
                            <div className="flex-1 opacity-50">
                                <p className="font-bold text-slate-800">Tránsito a Macas</p>
                                <p className="text-sm text-slate-500">Consolidación en el Centro de Control Jaguar (Control de Calidad y Etiquetado NFC).</p>
                            </div>
                        </div>

                        <div className="relative flex items-start gap-6 mb-10">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center z-10 text-slate-400">
                                <Package size={16} />
                            </div>
                            <div className="flex-1 opacity-50">
                                <p className="font-bold text-slate-800">Despacho Nacional/Int.</p>
                                <p className="text-sm text-slate-500">Salida vía Courier especializado.</p>
                            </div>
                        </div>

                        <div className="relative flex items-start gap-6">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center z-10 text-slate-400">
                                <Camera size={16} />
                            </div>
                            <div className="flex-1 opacity-50">
                                <p className="font-bold text-slate-800">Activación del Aliado</p>
                                <p className="text-sm text-slate-500">Recibirás coordenadas satelitales del sensor de IA que activaste.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-800 text-white p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-green-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-700 p-3 rounded-2xl">
                            <ShieldCheck size={24} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm opacity-80">Garantía de Origen</p>
                            <p className="font-bold">Pago al productor asegurado</p>
                        </div>
                    </div>
                    <button className="bg-green-400 hover:bg-green-300 transition-colors text-green-900 font-bold px-4 py-2 rounded-xl text-sm">Ver Contrato</button>
                </div>
            </div>
        </div>
    );
};

return (
    <div className="font-sans antialiased text-slate-900 selection:bg-green-100">
        {view === 'shop' && renderShop()}
        {view === 'product' && renderProductDetail()}
        {view === 'tracking' && renderTracking()}
    </div>
);
};


export default MarketplaceJaguar;

