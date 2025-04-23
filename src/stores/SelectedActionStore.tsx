import { createStore } from 'solid-js/store';

export type QuickActionType = 'search' | 'playback' | 'bookmarks' | 'ai-summary' | null;

const [state, setState] = createStore({
    selectedAction: null as QuickActionType,
});

/**
 * This store manages the selected action for the quick action menu.
 *
 * @param action - The action to set.
 */
function setSelectedAction(action: QuickActionType): void {
    setState('selectedAction', action);
}

/**
 * This function clears the selected action.
 */
function clearSelectedAction(): void {
    setState('selectedAction', null);
}

/**
 * This function toggles the selected action.
 *
 * @param action - The action to toggle.
 */
function toggleSelectedAction(action: QuickActionType): void {
    setState('selectedAction', prev => (prev === action ? null : action));
}

export { state, setSelectedAction, clearSelectedAction, toggleSelectedAction };
