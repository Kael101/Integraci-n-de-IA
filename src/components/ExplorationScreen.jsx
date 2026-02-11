import React, { useState, useEffect } from 'react';
import { fetchRoutes } from '../services/routesStub';
import { ExternalLink, MapPin, BadgeCheck, Loader } from 'lucide-react';

// URL del Google Form para los guías
const GOOGLE_FORM_URL = "https://forms.gle/tu-id-del-formulario";

export default function ExplorationScreen({ onClose }) {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRoutes = async () => {
            try {
                const allRoutes = await fetchRoutes();
                // Filtrar solo rutas aprobadas como se solicitó
                const approvedRoutes = allRoutes.filter(r => r.status === 'APPROVED');
                setRoutes(approvedRoutes);
            } catch (error) {
                console.error("Error loading routes:", error);
            } finally {
                setLoading(false);
            }
        };
        loadRoutes();
    }, []);

    const handleRegisterRoute = () => {
        window.open(GOOGLE_FORM_URL, '_blank');
    };

    const RouteCard = ({ item }) => (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 mb-4 border border-gray-100">
            <div className="relative h-48 w-full">
                <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; // Fallback layout
                    }}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-jaguar-900 shadow-sm uppercase tracking-wider">
                    {item.difficulty}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.title}</h3>
                    {item.is_verified && (
                        <div className="text-blue-500" title="Verificado">
                            <BadgeCheck size={20} fill="#E0F2FE" />
                        </div>
                    )}
                </div>

                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <MapPin size={14} />
                    Por: {item.provider}
                </p>

                <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                        {item.type}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-gray-50 overflow-y-auto pb-24"> {/* pb-24 for bottom nav space */}
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 py-4 flex justify-between items-center shadow-sm border-b border-gray-100">
                <h2 className="text-2xl font-bold text-jaguar-950">Territorio Jaguar</h2>
                <button
                    onClick={handleRegisterRoute}
                    className="bg-jaguar-500 hover:bg-jaguar-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-jaguar-500/20 transition-all flex items-center gap-2 active:scale-95"
                >
                    <span>+ Subir Ruta</span>
                    <ExternalLink size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-5 max-w-3xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader size={40} className="animate-spin mb-4 text-jaguar-500" />
                        <p>Cargando rutas verificadas...</p>
                    </div>
                ) : routes.length > 0 ? (
                    routes.map(item => (
                        <RouteCard key={item.id} item={item} />
                    ))
                ) : (
                    <div className="text-center py-20 px-6">
                        <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <MapPin size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay rutas aún</h3>
                        <p className="text-gray-500 text-sm">Sé el primero en compartir una ruta para la verificación.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
