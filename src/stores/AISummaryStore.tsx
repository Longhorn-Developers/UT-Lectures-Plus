import { createStore } from 'solid-js/store';
import { storage } from '#imports';

// Define a storage item for AI summaries with versioning support
const summaryStorage = storage.defineItem<Record<string, string>>('local:ai-summaries', {
    fallback: {}, // Default to empty object if not found
    version: 1, // Start with version 1 for future-proofing
});

// Create the store with url-to-summary mapping and current summary
const [state, setState] = createStore<{
    summaries: Record<string, string>;
    currentUrl: string;
    currentSummary: string;
    open: boolean;
}>({
    summaries: {},
    currentUrl: '',
    currentSummary: '',
    open: false,
});

// Load summaries from storage on initialization
async function loadSummaries() {
    try {
        const storedSummaries = await summaryStorage.getValue();
        if (storedSummaries) {
            setState('summaries', storedSummaries);
        }
    } catch (error) {
        console.error('Failed to load AI summaries:', error);
    }
}

// Save summaries to storage
async function saveSummaries() {
    try {
        await summaryStorage.setValue(state.summaries);
    } catch (error) {
        console.error('Failed to save AI summaries:', error);
    }
}

// Initialize by loading summaries
loadSummaries();

const AISummaryStore = {
    // Getters
    get currentSummary(): string {
        return state.currentSummary;
    },

    get currentUrl(): string {
        return state.currentUrl;
    },

    get summaries(): Record<string, string> {
        return state.summaries;
    },

    // Methods
    setCurrentUrl(url: string): void {
        setState('currentUrl', url);

        // Update current summary based on URL
        const existingSummary = state.summaries[url] || '';
        setState('currentSummary', existingSummary);
    },

    setSummary(summary: string): void {
        if (!state.currentUrl) {
            console.warn('Cannot save summary: No current URL set');
            return;
        }

        setState('currentSummary', summary);
        setState('summaries', prev => ({
            ...prev,
            [state.currentUrl]: summary,
        }));

        // Persist to storage
        saveSummaries();
    },

    getSummaryForUrl(url: string): string {
        return state.summaries[url] || '';
    },

    clearCurrentSummary(): void {
        setState('currentSummary', '');
    },

    clearAllSummaries(): void {
        setState('summaries', {});
        setState('currentSummary', '');
        saveSummaries();
    },

    toggleOpen(): void {
        setState('open', prev => !prev);
    },

    setOpen(value: boolean): void {
        setState('open', value);
    },

    isOpen(): boolean {
        return state.open;
    },
};

export default AISummaryStore;
