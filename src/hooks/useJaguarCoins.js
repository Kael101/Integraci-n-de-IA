/**
 * useJaguarCoins.js — Moneda de Lealtad "Garras de Oro"
 * ─────────────────────────────────────────────────────────────────────────────
 * Economía circular local sin backend requerido.
 *
 * GANANCIAS:
 *   +1 coin  por km caminado
 *   +5 coins por reporte Sentinel validado
 *  +10 coins por compra en Marketplace
 *
 * CANJE:
 *   1 coin = 1% de descuento en Marketplace (máx 30%)
 *
 * EXPIRACIÓN:
 *   Las coins vencen a los 90 días para generar urgencia de uso.
 *   Se limpian automáticamente al cargar el hook.
 */

import { useState, useEffect, useCallback } from 'react';

const COINS_KEY = 'tj_jaguar_coins';
const TX_LOG_KEY = 'tj_coins_tx_log';
const EXPIRY_DAYS = 90;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const MAX_DISCOUNT_PCT = 30;

// ─── Helpers de persistencia ──────────────────────────────────────────────────

const loadCoinBatches = () => {
    try { return JSON.parse(localStorage.getItem(COINS_KEY) || '[]'); }
    catch { return []; }
};

const saveCoinBatches = (batches) =>
    localStorage.setItem(COINS_KEY, JSON.stringify(batches));

const loadTxLog = () => {
    try { return JSON.parse(localStorage.getItem(TX_LOG_KEY) || '[]'); }
    catch { return []; }
};

const saveTxLog = (log) =>
    localStorage.setItem(TX_LOG_KEY, JSON.stringify(log.slice(-20))); // últimas 20

// ─── Cálculo de saldo (excluyendo lotes expirados) ───────────────────────────

const computeBalance = (batches) => {
    const now = Date.now();
    return batches
        .filter(b => (now - b.earnedAt) < EXPIRY_MS)
        .reduce((sum, b) => sum + b.amount, 0);
};

// ─────────────────────────────────────────────────────────────────────────────

export const useJaguarCoins = () => {
    const [batches, setBatches] = useState([]);
    const [balance, setBalance] = useState(0);
    const [txLog, setTxLog] = useState([]);

    // ─── Carga inicial + limpieza de expiradas ────────────────────────────────

    useEffect(() => {
        const raw = loadCoinBatches();
        const now = Date.now();
        // Filtrar lotes expirados al cargar
        const valid = raw.filter(b => (now - b.earnedAt) < EXPIRY_MS);
        if (valid.length !== raw.length) {
            saveCoinBatches(valid);
            console.log(`[Coins] 🗑️ ${raw.length - valid.length} lote(s) de coins expirados eliminados.`);
        }
        setBatches(valid);
        setBalance(computeBalance(valid));
        setTxLog(loadTxLog());
    }, []);

    // ─── Persistencia reactiva ───────────────────────────────────────────────

    useEffect(() => {
        saveCoinBatches(batches);
        setBalance(computeBalance(batches));
    }, [batches]);

    useEffect(() => {
        saveTxLog(txLog);
    }, [txLog]);

    // ─── API Pública ──────────────────────────────────────────────────────────

    /**
     * Añade coins a la billetera con su fuente y timestamp.
     * Cada lote tiene su propio timestamp para expiración independiente.
     *
     * @param {number} amount  - Cantidad de coins a añadir
     * @param {string} source  - Fuente: 'km' | 'report' | 'purchase' | string libre
     */
    const earnCoins = useCallback((amount, source = 'bonus') => {
        if (amount <= 0) return;

        const newBatch = { amount, earnedAt: Date.now(), source };
        const newTx = {
            type: 'earn',
            amount,
            source,
            ts: Date.now(),
            label: _sourceLabel(source),
        };

        setBatches(prev => [...prev, newBatch]);
        setTxLog(prev => [newTx, ...prev].slice(0, 20));
        console.log(`[Coins] +${amount} 🪙 (${source})`);
    }, []);

    /**
     * Canjea coins por descuento en Marketplace.
     * Consume los lotes más antiguos primero (FIFO para respetar expiración).
     *
     * @param {number} amount  - Coins a canjear
     * @returns {{ success: boolean, discountPct: number, reason?: string }}
     */
    const redeemCoins = useCallback((amount) => {
        if (amount <= 0) return { success: false, reason: 'Cantidad inválida' };
        if (balance < amount) {
            return { success: false, reason: `Saldo insuficiente (tienes ${balance} coins)` };
        }
        if (amount > MAX_DISCOUNT_PCT) {
            return { success: false, reason: `Máximo ${MAX_DISCOUNT_PCT} coins por canje` };
        }

        // Consumir lotes FIFO (más antiguos primero)
        let toDeduct = amount;
        const newBatches = [...batches].sort((a, b) => a.earnedAt - b.earnedAt);
        const updatedBatches = [];

        for (const batch of newBatches) {
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

        const tx = {
            type: 'redeem',
            amount: -amount,
            source: 'marketplace',
            ts: Date.now(),
            label: `Canje: ${amount}% descuento`,
        };

        setBatches(updatedBatches);
        setTxLog(prev => [tx, ...prev].slice(0, 20));
        console.log(`[Coins] -${amount} 🪙 canjeados → ${amount}% descuento`);

        return { success: true, discountPct: amount };
    }, [balance, batches]);

    /**
     * Atajo: gana coins según km caminados (1 coin/km).
     * @param {number} km
     */
    const earnFromKm = useCallback((km) => {
        const amount = Math.floor(km);
        if (amount > 0) earnCoins(amount, 'km');
    }, [earnCoins]);

    /**
     * Atajo: gana coins por reporte Sentinel validado (+5).
     */
    const earnFromReport = useCallback(() => earnCoins(5, 'report'), [earnCoins]);

    /**
     * Atajo: gana coins por compra en Marketplace (+10).
     */
    const earnFromPurchase = useCallback(() => earnCoins(10, 'purchase'), [earnCoins]);

    /**
     * Días hasta que expira el primer lote activo.
     * @returns {number|null}
     */
    const daysUntilFirstExpiry = useCallback(() => {
        if (batches.length === 0) return null;
        const oldest = [...batches].sort((a, b) => a.earnedAt - b.earnedAt)[0];
        const msLeft = EXPIRY_MS - (Date.now() - oldest.earnedAt);
        return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    }, [batches]);

    // ─── Debug ────────────────────────────────────────────────────────────────
    if (typeof window !== 'undefined') {
        window.__debug_coins = () => ({
            balance,
            batches: batches.length,
            daysUntilFirstExpiry: daysUntilFirstExpiry(),
            log: txLog,
        });
        // Populate con datos demo
        window.__debug_earnCoins = (n = 50, src = 'km') => earnCoins(n, src);
    }

    return {
        balance,
        txLog,
        earnCoins,
        redeemCoins,
        earnFromKm,
        earnFromReport,
        earnFromPurchase,
        daysUntilFirstExpiry,
        MAX_DISCOUNT_PCT,
    };
};

// ─── Private ──────────────────────────────────────────────────────────────────

const _sourceLabel = (source) => {
    const labels = {
        km: '🥾 Km caminado',
        report: '🌿 Reporte validado',
        purchase: '🛒 Compra local',
        bonus: '🎁 Bonus',
    };
    return labels[source] || `📌 ${source}`;
};

export default useJaguarCoins;
