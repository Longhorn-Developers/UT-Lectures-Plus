import { ChevronsRight } from 'lucide-solid';
import { JSX } from 'solid-js/jsx-runtime';

interface TopBarProps {
    toggleSidebar: () => void;
}
/**
 * TopBar component displays the title and a button to toggle the sidebar.
 *
 * @param props - The props object.
 * @returns The TopBar component.
 */
const TopBar = (props: TopBarProps): JSX.Element => {
    return (
        <div class='mb-1 flex items-center justify-between px-4'>
            <h1 class='text-2xl font-bold'>
                UT Lectures<span class='text-ut-burntorange'>+</span>
            </h1>

            <button
                onClick={() => {
                    props.toggleSidebar();
                }}
                class='text-ut-black rounded bg-transparent p-1 transition-colors duration-200 hover:cursor-pointer hover:bg-slate-100'
            >
                <ChevronsRight class='size-5' />
            </button>
        </div>
    );
};

export default TopBar;
