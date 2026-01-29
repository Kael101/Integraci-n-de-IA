import { useState, useEffect, useCallback } from 'react';

/**
 * useVoice Hook
 * Provee capacidades de Voz (STT) y Habla (TTS) usando Web Speech API.
 * 
 * @returns {Object} { isListening, transcript, speak, startListening, stopListening, hasSupport }
 */
export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [hasSupport, setHasSupport] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        // Verificar soporte del navegador
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false; // Detenerse después de una frase
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'es-ES'; // Español

            recognitionInstance.onstart = () => setIsListening(true);
            recognitionInstance.onend = () => setIsListening(false);
            recognitionInstance.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            setRecognition(recognitionInstance);
            setHasSupport(true);
        } else {
            console.warn("Web Speech API no soportada en este navegador.");
            setHasSupport(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                setTranscript(''); // Limpiar anterior
                recognition.start();
            } catch (e) {
                console.error("Error iniciando reconocimiento:", e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const speak = useCallback((text) => {
        if ('speechSynthesis' in window) {
            // Cancelar habla anterior si existe
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0; // Velocidad normal
            utterance.pitch = 1.0;

            // Intentar usar una voz de Google o Microsoft en español si está disponible
            const voices = window.speechSynthesis.getVoices();
            const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Microsoft')));
            if (esVoice) utterance.voice = esVoice;

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    return {
        isListening,
        transcript,
        speak,
        startListening,
        stopListening,
        hasSupport
    };
};
