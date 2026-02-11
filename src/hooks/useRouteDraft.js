import { useState, useEffect, useCallback } from 'react';

const DRAFT_KEY = 'jaguar_route_draft';

/**
 * useRouteDraft
 * 
 * Hook to save and load route creation drafts from localStorage.
 * Helps prevent data loss in case of connection issues or accidental refreshes.
 */
export const useRouteDraft = () => {
    const [draft, setDraft] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);

    // Load draft on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setDraft(parsed.data);
                setLastSaved(new Date(parsed.timestamp));
            }
        } catch (error) {
            console.error('Error loading route draft:', error);
        }
    }, []);

    // Save draft function
    const saveDraft = useCallback((data) => {
        try {
            const payload = {
                data,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
            setDraft(data);
            setLastSaved(new Date());
            return true;
        } catch (error) {
            console.error('Error saving route draft:', error);
            return false;
        }
    }, []);

    // Clear draft function
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(DRAFT_KEY);
            setDraft(null);
            setLastSaved(null);
        } catch (error) {
            console.error('Error clearing route draft:', error);
        }
    }, []);

    return {
        draft,
        lastSaved,
        saveDraft,
        clearDraft
    };
};
