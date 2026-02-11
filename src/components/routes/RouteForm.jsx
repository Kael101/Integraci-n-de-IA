import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Save, Upload, Map as MapIcon, Info, Users, Shield, AlertTriangle, CheckCircle, Sparkles, WifiOff } from 'lucide-react';
import MapRouteEditor from './MapRouteEditor';
import ImageUploader from '../common/ImageUploader';
import { useRouteDraft } from '../../hooks/useRouteDraft';
import { addRoute } from '../../services/firestoreService';
import { mcpClient } from '../../services/mcpClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeValidationSchema } from '../../schemas/routeSchema';

const CATEGORIES = ['Trekking', 'Ciclismo', 'Avistamiento de Aves', 'Cultural', 'Fotografía', 'Aventura'];
const DIFFICULTIES = ['Bajo', 'Medio', 'Alto', 'Experto'];
const POINT_TYPES = ['Fotografía', 'Descanso', 'Hidratación', 'Peligro', 'Historia', 'Mirador'];

const RouteForm = () => {
    const { draft, saveDraft, clearDraft } = useRouteDraft();
    const [submitting, setSubmitting] = useState(false);
    const [points, setPoints] = useState([]); // Waypoints from MapEditor
    const [geoJSON, setGeoJSON] = useState(null); // Route path from GPX
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isDirty } } = useForm({
        resolver: zodResolver(routeValidationSchema),
        defaultValues: {
            name: '',
            category: 'Trekking',
            difficulty: 'Medio',
            shortDescription: '',
            fullDescription: '',
            duration: '',
            distance: '',
            guideName: '',
            contactNumber: '',
            socialLink: '',
            maxCapacity: '',
            signalAvailable: 'Intermitente',
            equipment: '',
            waypoints: [],
            termsAccepted: false
        }
    });

    // Auto-save draft
    const formValues = watch();
    useEffect(() => {
        if (isDirty) {
            const timeout = setTimeout(() => {
                saveDraft({ ...formValues, points, geoJSON });
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [formValues, points, geoJSON, isDirty, saveDraft]);

    // Load draft
    useEffect(() => {
        if (draft) {
            reset(draft);
            if (draft.points) setPoints(draft.points);
            if (draft.geoJSON) setGeoJSON(draft.geoJSON);
        }
    }, [draft, reset]);

    // Sync Map Points with Form Waypoints
    useEffect(() => {
        // When points on map change, update the waypoints array in form if needed
        // For simplicity, we just keep them in sync or let the user edit details for valid points
        const currentWaypoints = formValues.waypoints || [];

        // Merge: Keep existing details for points that match IDs, add new ones
        const mergedWaypoints = points.map(p => {
            const existing = currentWaypoints.find(w => w.id === p.id);
            return existing || {
                id: p.id,
                name: `Punto ${points.indexOf(p) + 1}`,
                type: 'Fotografía',
                description: '',
                coordinates: [p.longitude, p.latitude]
            };
        });

        if (JSON.stringify(mergedWaypoints) !== JSON.stringify(currentWaypoints)) {
            setValue('waypoints', mergedWaypoints);
        }
    }, [points, setValue]); // Note: excluding formValues to avoid loop, handled logically

    const [enhancing, setEnhancing] = useState(false);

    const handleAIEnhance = async () => {
        const currentText = watch('fullDescription');
        if (!currentText || currentText.length < 5) {
            alert("Escribe al menos una frase base para que la IA pueda mejorarla.");
            return;
        }

        setEnhancing(true);
        try {
            const result = await mcpClient.callTool('ai-writer', 'enhance_description', { text: currentText });

            if (result && result.content && result.content[0]) {
                const improvedText = result.content[0].text;
                setValue('fullDescription', improvedText, { shouldDirty: true });
            }
        } catch (error) {
            console.error("Error mejorando texto:", error);
            alert("No se pudo conectar con el Asistente IA.");
        } finally {
            setEnhancing(false);
        }
    };

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            // Prepare payload
            const routePayload = {
                ...data,
                geometry: geoJSON || {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: points.map(p => [p.longitude, p.latitude]) }
                },
                waypoints: data.waypoints,
                createdAt: new Date().toISOString(),
                status: 'pending_review' // Quality control
            };

            const result = await addRoute(routePayload);

            if (result.success) {
                setSubmitSuccess(true);
                clearDraft();
                reset();
                setPoints([]);
                setGeoJSON(null);
                window.scrollTo(0, 0);
            } else {
                alert("Error al guardar la ruta. Intenta nuevamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Error inesperado.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-jaguar-900 rounded-2xl text-center animate-fade-in">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">¡Ruta Registrada!</h2>
                <p className="text-gray-400 mb-6">Tu ruta ha sido enviada a revisión. Pronto estará disponible en el Territorio Jaguar.</p>
                <button
                    onClick={() => setSubmitSuccess(false)}
                    className="bg-jaguar-500 text-black px-6 py-2 rounded-full font-bold hover:bg-jaguar-400"
                >
                    Registrar Otra Ruta
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
                        Nueva Ruta <span className="text-jaguar-500">Expedición</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Contribuye al mapa digital del Valle del Upano.</p>
                </div>
                {draft && <span className="text-xs text-amber-500 flex items-center gap-1"><Save size={12} /> Borrador guardado</span>}
            </div>

            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <section className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                    <Info className="text-jaguar-500" size={20} />
                    <h2 className="text-xl font-bold text-white">1. Información Básica</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Nombre de la Ruta *</label>
                        <input
                            {...register('name')}
                            className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none transition-colors`}
                            placeholder="Ej. Sendero de los Jaguares"
                        />
                        {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Categoría *</label>
                        <select
                            {...register('category')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Nivel de Dificultad</label>
                        <div className="flex gap-2">
                            {DIFFICULTIES.map(lvl => (
                                <label key={lvl} className={`flex-1 cursor-pointer text-center p-2 rounded-lg border transition-all ${watch('difficulty') === lvl ? 'bg-jaguar-500 text-black border-jaguar-500 font-bold' : 'bg-transparent border-white/20 text-gray-400 hover:bg-white/5'}`}>
                                    <input type="radio" value={lvl} {...register('difficulty')} className="hidden" />
                                    {lvl}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Duración Estimada</label>
                        <input
                            {...register('duration')}
                            placeholder="Ej. 3 horas 30 min"
                            className={`w-full bg-white/5 border ${errors.duration ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        />
                        {errors.duration && <span className="text-red-500 text-xs mt-1 block">{errors.duration.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Distancia (km)</label>
                        <input
                            type="number"
                            step="0.1"
                            {...register('distance')}
                            placeholder="Ej. 5.5"
                            className={`w-full bg-white/5 border ${errors.distance ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        />
                        {errors.distance && <span className="text-red-500 text-xs mt-1 block">{errors.distance.message}</span>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Descripción Corta (Mapa)</label>
                    <textarea
                        {...register('shortDescription')}
                        rows={2}
                        className={`w-full bg-white/5 border ${errors.shortDescription ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        placeholder="Breve resumen para la vista previa..."
                    />
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-red-500">{errors.shortDescription?.message}</span>
                        <span className="text-gray-500">{watch('shortDescription')?.length || 0}/150</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Descripción Detallada (Historia y Experiencia)</label>
                    <textarea
                        {...register('fullDescription')}
                        rows={5}
                        className={`w-full bg-white/5 border ${errors.fullDescription ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        placeholder="Cuenta la historia de la ruta, qué esperar, flora y fauna..."
                    />
                    {errors.fullDescription && <span className="text-red-500 text-xs mt-1 block">{errors.fullDescription.message}</span>}
                    <button
                        type="button"
                        onClick={handleAIEnhance}
                        disabled={enhancing}
                        className={`text-xs flex items-center gap-1 mt-1 transition-colors ${enhancing ? 'text-gray-500' : 'text-jaguar-400 hover:text-jaguar-300'}`}
                    >
                        {enhancing ? (
                            <>
                                <div className="animate-spin h-3 w-3 border-2 border-jaguar-500 rounded-full border-t-transparent"></div>
                                Mejorando...
                            </>
                        ) : (
                            <>
                                <Sparkles size={12} /> Mejorar con IA
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* SECCIÓN 2: DATOS GEOGRÁFICOS */}
            <section className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                    <MapIcon className="text-cyan-400" size={20} />
                    <h2 className="text-xl font-bold text-white">2. Geografía y Mapa</h2>
                </div>

                <MapRouteEditor
                    onPointsChange={setPoints}
                    onGPXUpload={setGeoJSON}
                    initialPoints={points}
                />

                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="bg-white/5 px-4 py-2 rounded-lg">
                        <span className="block text-xs text-gray-500">Puntos Marcados</span>
                        <span className="font-mono text-white text-lg">{points.length}</span>
                    </div>
                    {geoJSON && (
                        <div className="bg-cyan-900/20 border border-cyan-500/30 px-4 py-2 rounded-lg text-cyan-400 flex items-center gap-2">
                            <CheckCircle size={16} />
                            Ruta GPX Cargada
                        </div>
                    )}
                </div>
            </section>

            {/* SECCIÓN 3: WAYPOINTS (Detalles) */}
            {points.length > 0 && (
                <section className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-white">3. Puntos de Interés ({points.length})</h2>
                    </div>

                    <div className="space-y-4">
                        {points.map((point, index) => (
                            <div key={point.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-jaguar-500 rounded-full flex items-center justify-center font-bold text-black border-2 border-white">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-grow space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            {...register(`waypoints.${index}.name`)}
                                            defaultValue={`Punto ${index + 1}`}
                                            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                            placeholder="Nombre del punto"
                                        />
                                        <select
                                            {...register(`waypoints.${index}.type`)}
                                            className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                        >
                                            {POINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <textarea
                                        {...register(`waypoints.${index}.description`)}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                        placeholder="Descripción o dato curioso..."
                                    />
                                    <Controller
                                        control={control}
                                        name={`waypoints.${index}.image`}
                                        render={({ field }) => (
                                            <ImageUploader
                                                label="Foto del Punto (Opcional)"
                                                onImageSelected={(file) => field.onChange(file)}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN 4: CONTACTO Y SEGURIDAD */}
            <section className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                    <Shield className="text-green-500" size={20} />
                    <h2 className="text-xl font-bold text-white">4. Logística y Seguridad</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">Guía Responsable</label>
                        <input
                            {...register('guideName')}
                            placeholder="Tu nombre o agencia"
                            className={`w-full bg-white/5 border ${errors.guideName ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        />
                        {errors.guideName && <span className="text-red-500 text-xs mt-1 block">{errors.guideName.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm">WhatsApp de Contacto</label>
                        <input
                            {...register('contactNumber')}
                            placeholder="+593 99 999 9999"
                            type="tel"
                            className={`w-full bg-white/5 border ${errors.contactNumber ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none`}
                        />
                        {errors.contactNumber && <span className="text-red-500 text-xs mt-1 block">{errors.contactNumber.message}</span>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Equipo Necesario</label>
                    <input
                        {...register('equipment')}
                        placeholder="Ej. Botas de caucho, Impermeable, Linterna..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-jaguar-500 focus:outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Disponibilidad de Señal</label>
                    <div className={`flex gap-4 items-center bg-white/5 p-3 rounded-lg border ${errors.signalAvailable ? 'border-red-500' : 'border-transparent'}`}>
                        <WifiOff className="text-gray-500" />
                        <select
                            {...register('signalAvailable')}
                            className="bg-transparent text-white focus:outline-none w-full"
                        >
                            <option value="Nula" className="text-black">Nula</option>
                            <option value="Intermitente" className="text-black">Intermitente</option>
                            <option value="Buena" className="text-black">Buena</option>
                        </select>
                    </div>
                    {errors.signalAvailable && <span className="text-red-500 text-xs mt-1 block">{errors.signalAvailable.message}</span>}
                </div>
            </section>

            {/* SUBMIT */}
            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => saveDraft({ ...watch(), points, geoJSON })}
                    className="flex-1 bg-gray-800 text-white py-4 rounded-xl font-bold uppercase hover:bg-gray-700 transition px-6"
                >
                    Guardar Borrador
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] bg-gradient-to-r from-jaguar-500 to-amber-500 text-black py-4 rounded-xl font-black uppercase text-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Enviando...' : 'Publicar Ruta'}
                </button>
            </div>

        </form>
    );
};

export default RouteForm;
