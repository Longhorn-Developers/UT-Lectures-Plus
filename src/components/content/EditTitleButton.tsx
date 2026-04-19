import { createSignal, JSX, Show } from 'solid-js';
import { Pencil, Check } from 'lucide-solid';
import { saveCustomTitle } from '@/storage/lectureTitles';

interface EditTitleButtonProps {
    titleEl: HTMLElement;
    episodeUrl: string;
    originalTitle: string;
    onSave: (newTitle: string) => void;
}

/**
 * EditTileButton component
 *
 * Renders an inline edit button for a lecture title.
 * Clicking switches to an input field. Enter saves, Escape cancels.
 *
 * @param props - The episode metadata and title element to edit
 * @returns An edit/save button
 */
const EditTitleButton = (props: EditTitleButtonProps): JSX.Element => {
    const [isEditing, setIsEditing] = createSignal(false);

    let input: HTMLInputElement | undefined;

    const startEditing = () => {
        const currentText = props.titleEl.textContent?.trim() ?? props.originalTitle;

        input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.maxLength = 200;
        Object.assign(input.style, {
            display: 'inline-block',
            width: '320px',
            maxWidth: '100%',
            padding: '1px 6px',
            border: '1px solid var(--color-ut-burntorange)',
            borderRadius: '4px',
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(191,87,0,0.25)',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
            color: 'inherit',
            background: '#fff',
            verticalAlign: 'middle',
        });

        props.titleEl.style.display = 'none';
        props.titleEl.insertAdjacentElement('beforebegin', input);
        input.focus();
        input.select();

        input.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                commitSave();
            } else if (ev.key === 'Escape') {
                cancelEdit();
            }
        });

        setIsEditing(true);
    };

    const commitSave = async () => {
        const newTitle = input?.value.trim() || props.originalTitle;
        props.titleEl.textContent = newTitle;
        props.titleEl.style.display = '';
        input?.remove();
        await saveCustomTitle(props.episodeUrl, newTitle);
        props.onSave(newTitle);
        setIsEditing(false);
    };

    const cancelEdit = () => {
        props.titleEl.style.display = '';
        input?.remove();
        setIsEditing(false);
    };

    return (
        <div class='relative group inline-flex'>
            <button
                onClick={() => (isEditing() ? commitSave() : startEditing())}
                class='flex items-center justify-center w-9 h-9 rounded-md transition-colors duration-200 bg-gray-200 hover:bg-gray-300'
                classList={{ 'bg-ut-burntorange hover:bg-ut-burntorange': isEditing() }}
            >
                <Show when={isEditing()} fallback={<Pencil class='w-5 h-5' />}>
                    <Check class='w-5 h-5' color='white' />
                </Show>
            </button>
            <span class='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-lg text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100'>
                {isEditing() ? 'Save (Enter) · Cancel (Esc)' : 'Edit lecture title'}
            </span>
        </div>
    );
};

export default EditTitleButton;
