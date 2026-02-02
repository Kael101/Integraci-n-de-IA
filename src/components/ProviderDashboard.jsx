import React, { useState, useEffect } from 'react';
import {
    Plus, Package, MapPin, Camera, Sparkles,
    WifiOff, Wifi, Save, Mic, Headset, Info,
    LayoutDashboard, List, BarChart, Settings
} from 'lucide-react';
import { syncService } from '../services/syncService';
import InventoryModule from './InventoryModule';
import HeatMap from './GremioDashboard/HeatMap';
import { useCheckInSync } from '../hooks/useCheckInSync';

const ProviderDashboard = () => {
    const [subView, setSubView] = useState('inventory'); // 'inventory' | 'add' | 'stats'
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isTutorMode, setIsTutorMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // New: QR Auth
    // Gremio Sync
    const { checkIns, pendingSync } = useCheckInSync();
    const [localProducts, setLocalProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        nameNative: '', // Added native name
        category: 'Experiencia',
        price: '',
        description: '',
        stock: 5,
        location: 'Sector Cañón del Upano',
        image: null,
        validationStatus: 'pending_guardian' // Added validation status
    });

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        setLocalProducts(syncService.getLocalProducts());

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        // Validation with IA Mock
        if (!newProduct.name || !newProduct.price) {
            alert("La IA detecta información incompleta. Por favor revisa los campos.");
            return;
        }

        const saved = syncService.saveProductLocally(newProduct);
        setLocalProducts(prev => [...prev, saved]);
        setSubView('inventory');
        setNewProduct({
            name: '',
            nameNative: '',
            category: 'Experiencia',
            price: '',
            description: '',
            stock: 5,
            location: 'Sector Cañón del Upano',
            image: null,
            validationStatus: 'pending_guardian'
        });
    };

    const renderAuth = () => (
        <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-xl mx-auto text-center px-6">
            <div className="bg-slate-900/60 border border-slate-700/50 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                <div className="relative z-10">
                    <div className="bg-slate-800 w-32 h-32 mx-auto rounded-3xl flex items-center justify-center mb-10 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <List size={48} className="text-emerald-500" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Acceso de <span className="text-emerald-500">Comunidad</span></h2>
                    <p className="text-slate-400 font-medium mb-12 leading-relaxed">Escanea tu código de Proveedor Autorizado para comenzar a cargar tus tesoros.</p>
                    <button
                        onClick={() => setIsAuthenticated(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl shadow-emerald-900/40 active:scale-95 group"
                    >
                        <Camera size={24} />
                        <span className="text-lg uppercase tracking-widest">Escanear QR</span>
                    </button>
                    <p className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Cero Intermediarios · Soberanía Financiera</p>
                </div>
            </div>
        </div>
    );

    const renderModoTutor = (label, audioKey) => {
        if (!isTutorMode) return null;
        return (
            <div className="flex gap-2 mt-2">
                <button className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 hover:bg-emerald-500/30 transition-all">
                    <Mic size={14} />
                </button>
                <button className="bg-blue-500/20 p-2 rounded-full text-blue-400 hover:bg-blue-500/30 transition-all">
                    <Headset size={14} />
                </button>
                <span className="text-[10px] text-slate-500 italic mt-1.5 flex items-center gap-1">
                    <Info size={10} /> Escuchar guía en Shuar / Achuar
                </span>
            </div>
        );
    };

    const renderAddProduct = () => (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-[3rem] p-10 backdrop-blur-3xl shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Nuevo Recurso</h2>
                    {!isOnline && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20">
                            <WifiOff size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Modo Offline</span>
                        </div>
                    )}
                </div>

                <form className="space-y-8" onSubmit={handleSave}>
                    {/* Categoría */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Categoría</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Experiencia', 'Alojamiento', 'Artesanía'].map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                    className={`py-4 rounded-[1.5rem] text-xs font-bold transition-all border ${newProduct.category === cat
                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/40'
                                        : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {renderModoTutor("Categoría", "cat_audio")}
                    </div>

                    {/* Datos Básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Nombre (Español)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-800/30 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Collar de Semillas..."
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            {renderModoTutor("Nombre", "name_audio")}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Nombre (Shuar/Achuar)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-800/30 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500 outline-none transition-colors italic"
                                placeholder="Nombre nativo..."
                                value={newProduct.nameNative}
                                onChange={(e) => setNewProduct({ ...newProduct, nameNative: e.target.value })}
                            />
                            {renderModoTutor("Nombre Nativo", "native_audio")}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Precio (USD)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800/30 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                placeholder="0.00"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            />
                            {renderModoTutor("Precio", "price_audio")}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Stock Inicial</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800/30 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                placeholder="1"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Plantilla de Cámara Mock */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-4">Captura Multimedia</label>
                        <div className="aspect-video bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500 transition-colors cursor-pointer">
                            {/* Overlay Plantilla Guía */}
                            <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                                <div className="w-12 h-12 border-2 border-white/10 rounded-full"></div>
                                <div className="absolute inset-0 border border-white/5 rounded-xl"></div>
                            </div>
                            <Camera size={32} className="text-slate-500 mb-2 group-hover:text-emerald-500 transition-colors" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center px-8">
                                Centra el producto en el cuadro para asegurar calidad élite
                            </p>
                        </div>
                    </div>

                    {/* Etiquetado Geográfico Automático */}
                    <div className="p-6 bg-slate-800/20 border border-dashed border-slate-700 rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Ubicación Detectada</p>
                                <p className="text-sm font-bold text-white tracking-tight">{newProduct.location}</p>
                            </div>
                        </div>
                        <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">
                            GPS Lock OK
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl shadow-emerald-900/40 active:scale-[0.98] group"
                    >
                        <Save size={24} className="group-hover:bounce" />
                        <span className="text-xl tracking-tight uppercase">Guardar y Sincronizar</span>
                    </button>
                </form>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Inventory Card Loop */}
                {localProducts.map(prod => (
                    <div key={prod.id} className="group bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-xl relative overflow-hidden">
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${prod.status === 'synced' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                            {prod.status === 'synced' ? 'Sincronizado' : 'Pendiente Sync'}
                        </div>

                        <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">{prod.name}</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium tracking-tight">{prod.category}</p>

                        <InventoryModule
                            type={prod.category === 'Artesanía' ? 'artisan' : 'guide'}
                            data={{ stock: prod.stock || 5, slots: prod.slots || 3 }}
                            onUpdate={(val) => console.log('Update:', val)}
                        />

                        <div className="mt-8 flex justify-between items-center pt-8 border-t border-slate-800">
                            <p className="text-3xl font-black text-white tracking-widest">${prod.price}</p>
                            <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-2xl text-slate-400 transition-colors">
                                <Sparkles size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New FAB Placeholder */}
                <button
                    onClick={() => setSubView('add')}
                    className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 group hover:border-emerald-500/50 transition-all bg-slate-900/20"
                >
                    <div className="p-8 bg-slate-800 rounded-full text-slate-500 group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:rotate-90">
                        <Plus size={48} />
                    </div>
                    <p className="text-sm font-black text-slate-600 uppercase tracking-[0.3em] group-hover:text-emerald-500">Añadir Nuevo</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b0f19] p-8 text-slate-300 selection:bg-emerald-500/30">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                    <div className="bg-emerald-600 p-4 rounded-[1.5rem] text-white shadow-2xl shadow-emerald-900/40">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter leading-tight italic">Panel de <span className="text-emerald-500 uppercase not-italic">Proveedor</span></h1>
                        <div className="flex items-center gap-3 mt-1">
                            {isOnline ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <Wifi size={12} /> Live Sync
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                                    <WifiOff size={12} /> Local Storage
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Modo Tutor Toggle */}
                    <button
                        onClick={() => setIsTutorMode(!isTutorMode)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 ${isTutorMode
                            ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-900/20'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                            }`}
                    >
                        <Sparkles size={18} className={isTutorMode ? 'animate-pulse' : ''} />
                        <span className="text-xs font-black uppercase tracking-widest">Modo Tutor</span>
                    </button>

                    <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                        <button
                            onClick={() => setSubView('inventory')}
                            className={`p-3 rounded-xl transition-all ${subView === 'inventory' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setSubView('stats')}
                            className={`p-3 rounded-xl transition-all ${subView === 'stats' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                        >
                            <BarChart size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {!isAuthenticated ? renderAuth() : (
                    subView === 'add' ? renderAddProduct() : renderInventory()
                )}

                {subView === 'stats' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* KPI Cards */}
                            <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-[2.5rem] p-8 backdrop-blur-xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                                        <BarChart size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Impacto del Gremio</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 p-4 rounded-2xl">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Visitas Totales</p>
                                        <p className="text-3xl font-black text-white">{checkIns.length}</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Pendientes Sync</p>
                                        <p className={`text-3xl font-black ${pendingSync > 0 ? 'text-yellow-500' : 'text-emerald-500'}`}>{pendingSync}</p>
                                    </div>
                                </div>
                            </div>

                            {/* HeatMap Container */}
                            <div className="flex-[2]">
                                <HeatMap checkIns={checkIns} />
                            </div>
                        </div>

                        <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-[2rem] p-6 text-center">
                            <p className="text-slate-500 font-medium text-sm">
                                <span className="text-emerald-500 font-bold">* Privacidad Protegida:</span> Los datos de ubicación se anonimizan antes de sincronizarse con la Nube del Gremio.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProviderDashboard;
