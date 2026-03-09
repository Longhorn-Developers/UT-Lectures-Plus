import { createSignal, JSX } from 'solid-js';
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
    const [isHovered, setIsHovered] = createSignal(false);

    // Consider a button to be in expanded state when either hovered or active
    const isExpanded = () => isHovered() || props.active;

    return (
        <button
            title={props.title || props.label}
            onClick={e => {
                if (typeof props.onClick === 'function') {
                    props.onClick(e);
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
            {props.label && (
                <span
                    class='w-fit overflow-hidden text-xs font-medium whitespace-nowrap text-slate-800 transition-all duration-400 ease-in-out'
                    classList={{
                        'opacity-0': !isExpanded(),
                        'max-w-0': !isExpanded(),
                        'pl-0': !isExpanded(),
                        'opacity-100': isExpanded(),
                        'max-w-[100px]': isExpanded(),
                        'pl-1': isExpanded(),
                        'text-white': props.active,
                    }}
                >
                    {props.label}
                </span>
            )}
        </button>
    );
};

export default Button;
