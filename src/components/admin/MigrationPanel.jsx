import React, { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { runAllMigrations } from '../../utils/migrateToFirestore';

/**
 * PANEL DE ADMINISTRACIÓN: MIGRACIÓN DE DATOS
 * Componente temporal para ejecutar la migración inicial a Firestore
 */
const MigrationPanel = ({ onClose }) => {
    const [status, setStatus] = useState('idle'); // idle, migrating, success, error
    const [message, setMessage] = useState('');

    const handleMigration = async () => {
        setStatus('migrating');
        setMessage('Iniciando migración...');

        try {
            await runAllMigrations();
            setStatus('success');
            setMessage('¡Migración completada! Todos los datos están ahora en Firestore.');
        } catch (error) {
            setStatus('error');
            setMessage(`Error: ${error.message}`);
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-jaguar-950 flex items-center justify-center p-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl">

                <div className="flex items-center gap-3 mb-6">
                    <Database className="text-jaguar-500" size={32} />
                    <div>
                        <h2 className="font-display font-bold text-xl text-white">Migración a Firestore</h2>
                        <p className="text-xs text-white/50">Panel de Administración</p>
                    </div>
                </div>

                <p className="text-sm text-white/80 mb-6 leading-relaxed">
                    Este proceso subirá los datos de demostración (socios, rutas, productos) a la base de datos en la nube.
                </p>

                {status === 'idle' && (
                    <button
                        onClick={handleMigration}
                        className="w-full bg-jaguar-500 hover:bg-jaguar-400 text-jaguar-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Upload size={20} />
                        Iniciar Migración
                    </button>
                )}

                {status === 'migrating' && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-400">{message}</span>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3 mb-4">
                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                            <div>
                                <p className="text-sm text-green-400 font-bold mb-1">Migración Exitosa</p>
                                <p className="text-xs text-green-300/80">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                        >
                            Cerrar y Continuar
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                        <div>
                            <p className="text-sm text-red-400 font-bold mb-1">Error en Migración</p>
                            <p className="text-xs text-red-300/80">{message}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MigrationPanel;
