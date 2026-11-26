import { JSX } from 'solid-js';
import type { LucideIcon } from 'lucide-solid';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    icon: LucideIcon;
    active: boolean;
}

/**
 * Button component
 *
 * @param props - The button properties
 * @param props.label - The label for the button
 * @param props.icon - The icon component for the button
 * @param props.active - Whether the button is active
 *
 * @returns The button component
 */
const Button = (props: ButtonProps): JSX.Element => {
    return (
        <button
            title={props.title || props.label}
            onClick={e => {
                if (typeof props.onClick === 'function') {
                    props.onClick(e);
                }
            }}
            class={`flex h-7 items-center rounded bg-slate-100 px-1.5 py-1 transition-colors duration-400 hover:cursor-pointer hover:bg-slate-200 ${props.classList}`}
            classList={{
                'bg-ut-burntorange hover:bg-ut-burntorange/90': props.active,
                'bg-slate-100': !props.label,
            }}
            {...props}
        >
            <props.icon
                class='text-theme-black size-4 stroke-2 transition-all duration-400 ease-in-out'
                classList={{
                    'text-white': props.active,
                }}
            />
        </button>
    );
};

export default Button;
