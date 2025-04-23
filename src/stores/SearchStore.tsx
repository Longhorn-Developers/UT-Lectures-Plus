import { createStore } from 'solid-js/store';

// Create the store
const [state, setState] = createStore({
    query: '',
});

const SearchStore = {
    get query(): string {
        return state.query;
    },
    setQuery(newQuery: string): void {
        setState({ query: newQuery });
    },
    clear(): void {
        setState({ query: '' });
    },
};

export default SearchStore;
