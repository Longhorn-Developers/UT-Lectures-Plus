import { VIEW_MODE_KEY, getCurrentMode, applyViewMode } from './gridView';

const COLORS = {
    burntorange: '#bf5700',
    white: '#FFFFFF',
};

/**
 * Builds the list/grid view toggle toolbar
 *
 * Renders two icon buttons (list and grid) reflecting the currently saved
 *
 * @returns The toolbar element containing the view toggle buttons
 */
export function buildViewToggle(): HTMLElement {
    const savedMode = getCurrentMode();

    const toolbar = document.createElement('div');
    toolbar.id = 'utlp-view-toolbar';
    Object.assign(toolbar.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '16px',
        marginTop: '12px',
    });

    const makeBtn = (mode: 'list' | 'grid', iconClass: string, label: string): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.dataset.utlpViewMode = mode;
        btn.title = label;
        btn.setAttribute('aria-label', label);

        const i = document.createElement('i');
        i.className = `ph ${iconClass}`;
        btn.appendChild(i);

        const applyActive = (isActive: boolean) => {
            Object.assign(btn.style, {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: '1.5px solid',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                fontSize: '18px',
                borderColor: isActive ? COLORS.burntorange : '#d1d5db',
                background: isActive ? COLORS.burntorange : COLORS.white,
                color: isActive ? COLORS.white : '#6b7280',
            });
        };

        applyActive(mode === savedMode);

        btn.addEventListener('mouseenter', () => {
            if (btn.dataset.utlpViewMode !== getCurrentMode()) {
                btn.style.background = '#f3f4f6';
                btn.style.color = '#374151';
            }
        });

        btn.addEventListener('mouseleave', () => {
            applyActive(btn.dataset.utlpViewMode === getCurrentMode());
        });

        btn.addEventListener('click', () => {
            localStorage.setItem(VIEW_MODE_KEY, mode);

            toolbar.querySelectorAll<HTMLButtonElement>('[data-utlp-view-mode]').forEach(b => {
                const isActive = b.dataset.utlpViewMode === mode;
                Object.assign(b.style, {
                    borderColor: isActive ? COLORS.burntorange : '#d1d5db',
                    background: isActive ? COLORS.burntorange : COLORS.white,
                    color: isActive ? COLORS.white : '#6b7280',
                });
            });

            applyViewMode(mode);
        });

        return btn;
    };

    toolbar.appendChild(makeBtn('list', 'ph-list', 'List view'));
    toolbar.appendChild(makeBtn('grid', 'ph-grid-four', 'Grid view'));

    return toolbar;
}
