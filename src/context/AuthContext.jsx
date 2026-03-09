/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Contexto de autenticación para Territorio Jaguar.
 *
 * MÉTODOS:
 *   loginWithGoogle()    — OAuth2 via Firebase (requiere conexión)
 *   registerPasskey()    — Crea credencial FIDO2 en el dispositivo (offline-friendly)
 *   loginWithPasskey()   — Autentica con biometría/PIN del dispositivo
 *   logout()             — Cierra sesión
 *
 * PASKEYS (WebAuthn):
 *   - La clave privada NUNCA sale del TPM/Secure Enclave del dispositivo
 *   - Se almacena solo el identificador (credentialId) en localStorage
 *   - No requiere servidor WebAuthn; funciona en modo local-first
 *   - Soporte: Chrome 108+, Safari 16+, Firefox 122+
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ─── Helpers WebAuthn ─────────────────────────────────────────────────────────

const PASSKEY_CRED_KEY = 'tj_passkey_credential_id';
const PASSKEY_USER_KEY = 'tj_passkey_user';

const _bufferToBase64 = (buffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)));

const _base64ToBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

// RP (Relying Party) — dominio de la app
const RP_ID = window.location.hostname || 'localhost';
const RP_NAME = 'Territorio Jaguar';

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Detecta si el browser soporta WebAuthn / passkeys
    const passkeyAvailable =
        typeof window !== 'undefined' &&
        !!window.PublicKeyCredential &&
        !!navigator.credentials;

    // Firebase auth listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
                return;
            }
            // Si no hay sesión Firebase, restaurar usuario local de passkey
            const localUser = localStorage.getItem(PASSKEY_USER_KEY);
            if (localUser) {
                try { setUser(JSON.parse(localUser)); }
                catch { setUser(null); }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    // ─── Google OAuth ────────────────────────────────────────────────────────
    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    // ─── WebAuthn: Registro de Passkey ───────────────────────────────────────
    /**
     * Registra una nueva passkey en el dispositivo del usuario.
     * Requiere interacción biométrica (huella/cara/PIN).
     *
     * @param {string} [displayName] — Nombre visible del usuario
     * @returns {Promise<boolean>} true si el registro fue exitoso
     */
    const registerPasskey = async (displayName = 'Explorador Jaguar') => {
        if (!passkeyAvailable) {
            console.warn('[WebAuthn] No soportado en este browser.');
            return false;
        }

        try {
            const userId = crypto.getRandomValues(new Uint8Array(16));
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { id: RP_ID, name: RP_NAME },
                    user: {
                        id: userId,
                        name: displayName,
                        displayName,
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' }, // ES256 (ECDSA P-256)
                        { alg: -257, type: 'public-key' }, // RS256 (RSA)
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform', // biometría del dispositivo
                        requireResidentKey: true,
                        userVerification: 'required',
                    },
                    timeout: 60000,
                    attestation: 'none', // sin envío de datos a servidor
                },
            });

            if (!credential) return false;

            // Persistir solo el credentialId (seguro — es el identificador público)
            const credId = _bufferToBase64(credential.rawId);
            localStorage.setItem(PASSKEY_CRED_KEY, credId);

            // Usuario local (modo offline sin Firebase)
            const localUser = {
                uid: `passkey_${credId.slice(0, 8)}`,
                displayName,
                photoURL: null,
                provider: 'webauthn',
            };
            localStorage.setItem(PASSKEY_USER_KEY, JSON.stringify(localUser));
            setUser(localUser);

            console.log('[WebAuthn] ✅ Passkey registrada exitosamente.');
            return true;
        } catch (err) {
            console.error('[WebAuthn] Error registrando passkey:', err);
            return false;
        }
    };

    // ─── WebAuthn: Autenticación con Passkey ─────────────────────────────────
    /**
     * Autentica al usuario con la passkey previamente registrada.
     * @returns {Promise<boolean>} true si la autenticación fue exitosa
     */
    const loginWithPasskey = async () => {
        if (!passkeyAvailable) {
            console.warn('[WebAuthn] No soportado en este browser.');
            return false;
        }

        const storedCredId = localStorage.getItem(PASSKEY_CRED_KEY);
        if (!storedCredId) {
            console.warn('[WebAuthn] No hay passkey registrada en este dispositivo.');
            return false;
        }

        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    rpId: RP_ID,
                    allowCredentials: [{
                        id: _base64ToBuffer(storedCredId),
                        type: 'public-key',
                        transports: ['internal'],
                    }],
                    userVerification: 'required',
                    timeout: 60000,
                },
            });

            if (!assertion) return false;

            // Restaurar sesión local
            const localUser = JSON.parse(localStorage.getItem(PASSKEY_USER_KEY) || 'null');
            if (localUser) {
                setUser(localUser);
                console.log('[WebAuthn] ✅ Autenticación biométrica exitosa.');
                return true;
            }
            return false;
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                console.warn('[WebAuthn] El usuario canceló la autenticación.');
            } else {
                console.error('[WebAuthn] Error autenticando:', err);
            }
            return false;
        }
    };

    // ─── Logout ──────────────────────────────────────────────────────────────
    const logout = async () => {
        localStorage.removeItem(PASSKEY_USER_KEY);
        setUser(null);
        try { await signOut(auth); } catch { /* ya deslogueado de Firebase */ }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            passkeyAvailable,
            loginWithGoogle,
            registerPasskey,
            loginWithPasskey,
            logout,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

