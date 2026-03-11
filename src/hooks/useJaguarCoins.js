/**
 * useJaguarCoins.js — Moneda de Lealtad "Garras de Oro"
 * ─────────────────────────────────────────────────────────────────────────────
 * Economía circular local-first. Balance gestionado en el dispositivo
 * con reglas estrictas de caducidad para fomentar que los beneficios
 * fluyan hacia los comercios locales de Morona Santiago.
 *
 * GANANCIAS:
 *   +1 coin  por km caminado      (earnFromKm)
 *   +5 coins por reporte validado (earnFromReport)
 *  +10 coins por compra local     (earnFromPurchase)
 *
 * CANJE:
 *   1 coin = 1% de descuento en Marketplace (máx 30%)
 *   Lógica FIFO: se gastan primero las coins más próximas a vencer.
 *
 * EXPIRACIÓN (90 días):
 *   Cada "lote" de coins lleva su propio timestamp.
 *   Al cargar el hook, los lotes expirados desaparecen automáticamente.
 *   Esto genera urgencia de uso y evita inflación permanente.
 *
 * STORAGE:
 *   Una única clave 'territorio_jaguar_coins' (objeto consolidado).
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'territorio_jaguar_coins';
const EXPIRY_DAYS = 90;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const MAX_DISCOUNT_PCT = 30;
const MAX_HISTORY = 50; // últimas 50 transacciones en historial visible

// ─── Estado inicial ───────────────────────────────────────────────────────────

/**
 * Estructura del vault:
 * {
 *   batches:      Array<{ id, amount, earnedAt, source }> — lotes activos
 *   transactions: Array<{ id, type, amount, source, reason, ts, label }> — historial
 * }
 */
const _initVault = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Compatibilidad con estructura anterior (tj_jaguar_coins como array)
            if (Array.isArray(parsed)) {
                return { batches: parsed, transactions: [] };
            }
            return {
                batches: parsed.batches ?? [],
                transactions: parsed.transactions ?? [],
            };
        }
    } catch { /* silent */ }
    return { batches: [], transactions: [] };
};

// ─── Helpers puros ────────────────────────────────────────────────────────────

const _isExpired = (batch) => (Date.now() - batch.earnedAt) >= EXPIRY_MS;

const _computeBalance = (batches) =>
    batches
        .filter(b => !_isExpired(b))
        .reduce((sum, b) => sum + b.amount, 0);

const _sourceLabel = (source) => {
    const labels = {
        km: '🥾 Km caminado',
        report: '🌿 Reporte validado',
        purchase: '🛒 Compra local',
        bonus: '🎁 Bonus',
        RECORRIDO_KM: '🥾 Km caminado',
        REPORTE_VALIDO: '🌿 Reporte validado',
        APOYO_LOCAL: '🛒 Compra local',
        CANJE_DESCUENTO: '🎁 Canje descuento',
    };
    return labels[source] || `📌 ${source}`;
};

// ─────────────────────────────────────────────────────────────────────────────

export const useJaguarCoins = () => {
    const [vault, setVault] = useState(_initVault);

    // ─── Limpieza de expirados + persistencia ─────────────────────────────────
    //
    // IMPORTANTE: setVault siempre recibe una función (prev => ...) y la
    // persistencia ocurre DENTRO del mismo updater para evitar leer un estado
    // clausurado ("stale closure"). Así nunca escribimos el estado viejo.

    useEffect(() => {
        setVault(prev => {
            const validBatches = prev.batches.filter(b => !_isExpired(b));
            const expired = prev.batches.length - validBatches.length;
            if (expired > 0) {
                console.log(`[Coins] 🗑️ ${expired} lote(s) de Garras de Oro expirados eliminados.`);
            }
            const next = { ...prev, batches: validBatches };
            // Persistir el estado limpio directamente
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* cuota */ }
            return next;
        });
    }, []); // Solo al montar — la limpieza de expirados es un evento de inicio

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(vault)); } catch { /* cuota */ }
    }, [vault]);

    // ─── Derivados ────────────────────────────────────────────────────────────

    const balance = _computeBalance(vault.batches);

    // ─── Ganancia de Coins ────────────────────────────────────────────────────

    /**
     * Añade un lote de coins con su fuente y timestamp propio para expiración.
     * @param {number} amount
     * @param {string} source  'km' | 'report' | 'purchase' | string libre
     * @param {string} [reason] Razón legible (opcional)
     */
    const earnCoins = useCallback((amount, source = 'bonus', reason) => {
        if (amount <= 0) return;
        const now = Date.now();
        const newBatch = { id: `B-${now}-${Math.random().toString(36).slice(2, 6)}`, amount, earnedAt: now, source };
        const newTx = {
            id: now,
            type: 'earn',
            amount,
            source,
            reason: reason ?? _sourceLabel(source),
            ts: now,
            label: _sourceLabel(source),
        };
        setVault(prev => ({
            batches: [...prev.batches, newBatch],
            transactions: [newTx, ...prev.transactions].slice(0, MAX_HISTORY),
        }));
        console.log(`[Coins] +${amount} 🪙 Garras de Oro (${source})`);
    }, []);

    /** +1 coin por km caminado */
    const earnFromKm = useCallback((km) => {
        const amount = Math.floor(km);
        if (amount > 0) earnCoins(amount, 'km', `${km.toFixed(2)} km recorridos`);
    }, [earnCoins]);

    /** +5 coins por reporte Sentinel validado */
    const earnFromReport = useCallback(() => earnCoins(5, 'report'), [earnCoins]);

    /** +10 coins por compra en comercio local */
    const earnFromPurchase = useCallback(() => earnCoins(10, 'purchase'), [earnCoins]);

    // ─── Redención FIFO ───────────────────────────────────────────────────────

    /**
     * Canjea coins por descuento en Marketplace.
     * Consume los lotes más antiguos primero (FIFO).
     * El descuento máximo es MAX_DISCOUNT_PCT (30%).
     *
     * @param {number} amount - Coins a canjear
     * @returns {{ success: boolean, discountPct: number, reason?: string }}
     */
    const redeemCoins = useCallback((amount) => {
        if (amount <= 0) return { success: false, reason: 'Cantidad inválida' };
        if (amount > balance) return { success: false, reason: `Saldo insuficiente (tienes ${balance} coins)` };
        if (amount > MAX_DISCOUNT_PCT) return { success: false, reason: `Máximo ${MAX_DISCOUNT_PCT} coins por canje` };

        // FIFO: ordenar por antigüedad, consumir primero los más viejos
        const sorted = [...vault.batches]
            .filter(b => !_isExpired(b))
            .sort((a, b) => a.earnedAt - b.earnedAt);

        let toDeduct = amount;
        const updatedBatches = [];

        for (const batch of sorted) {
            if (toDeduct <= 0) {
                updatedBatches.push(batch);
                continue;
            }
            if (batch.amount <= toDeduct) {
                toDeduct -= batch.amount; // Lote consumido completamente
            } else {
                updatedBatches.push({ ...batch, amount: batch.amount - toDeduct });
                toDeduct = 0;
            }
        }

        const redeemTx = {
            id: Date.now(),
            type: 'redeem',
            amount: -amount,
            source: 'marketplace',
            reason: `Canje: ${amount}% descuento`,
            ts: Date.now(),
            label: `🎟️ Canje: ${amount}% descuento`,
        };

        setVault(prev => ({
            batches: updatedBatches,
            transactions: [redeemTx, ...prev.transactions].slice(0, MAX_HISTORY),
        }));
        console.log(`[Coins] -${amount} 🪙 canjeados → ${amount}% descuento en Marketplace`);
        return { success: true, discountPct: amount };
    }, [balance, vault.batches]);

    /**
     * Gasta coins en un canje físico (POI partner) — sin límite de porcentaje.
     * Usa la misma arquitectura FIFO que redeemCoins.
     *
     * @param {number} amount    — Coins a gastar
     * @param {string} reason    — Descripción legible (ej. 'Pack Energético · Jungle Protein')
     * @returns {{ success: boolean, reason?: string }}
     */
    const spendCoins = useCallback((amount, reason = 'Canje POI') => {
        if (amount <= 0) return { success: false, reason: 'Cantidad inválida' };
        if (amount > balance) return { success: false, reason: `Saldo insuficiente (tienes ${balance} 🪙)` };

        // FIFO: consumir primero los lotes más próximos a vencer
        const sorted = [...vault.batches]
            .filter(b => !_isExpired(b))
            .sort((a, b) => a.earnedAt - b.earnedAt);

        let toDeduct = amount;
        const updatedBatches = [];

        for (const batch of sorted) {
            if (toDeduct <= 0) { updatedBatches.push(batch); continue; }
            if (batch.amount <= toDeduct) {
                toDeduct -= batch.amount;
            } else {
                updatedBatches.push({ ...batch, amount: batch.amount - toDeduct });
                toDeduct = 0;
            }
        }

        const spendTx = {
            id: Date.now(),
            type: 'redeem',
            amount: -amount,
            source: 'poi_partner',
            reason,
            ts: Date.now(),
            label: `🏪 ${reason}`,
        };

        setVault(prev => ({
            batches: updatedBatches,
            transactions: [spendTx, ...prev.transactions].slice(0, MAX_HISTORY),
        }));
        console.log(`[Coins] -${amount} 🪙 gastados en canje POI: ${reason}`);
        return { success: true };
    }, [balance, vault.batches]);

    // ─── Utilidades ────────────────────────────────────────────────────────────

    /**
     * Días hasta que expira el primer lote activo.
     * Útil para mostrar "⚠️ Tienes coins que vencen en X días".
     * @returns {number|null}
     */
    const daysUntilFirstExpiry = useCallback(() => {
        const active = vault.batches.filter(b => !_isExpired(b));
        if (active.length === 0) return null;
        const oldest = active.sort((a, b) => a.earnedAt - b.earnedAt)[0];
        const msLeft = EXPIRY_MS - (Date.now() - oldest.earnedAt);
        return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    }, [vault.batches]);

    // ─── Debug ────────────────────────────────────────────────────────────────
    if (typeof window !== 'undefined') {
        window.__debug_coins = () => ({
            balance,
            batches: vault.batches.length,
            daysUntilFirstExpiry: daysUntilFirstExpiry(),
            transactions: vault.transactions.slice(0, 10),
        });
        window.__debug_earnCoins = (n = 50, src = 'km') => earnCoins(n, src);
        window.__debug_redeemCoins = (n = 10) => redeemCoins(n);
    }

    // ─── API Pública ──────────────────────────────────────────────────────────
    return {
        // Saldo actual (alias dual: balance + coins para compatibilidad con ProfileView y la propuesta)
        balance,
        coins: balance,
        // Historial de transacciones
        txLog: vault.transactions,
        history: vault.transactions,
        // Acciones
        earnCoins,
        earnFromKm,
        earnFromReport,
        earnFromPurchase,
        redeemCoins,
        spendCoins,
        // Utilidades
        daysUntilFirstExpiry,
        MAX_DISCOUNT_PCT,
        maxDiscount: MAX_DISCOUNT_PCT,
    };
};

export default useJaguarCoins;
