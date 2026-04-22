import { browser, defineContentScript } from '#imports';
import { formatLectureTitle } from './utils';

const COLORS = {
    burntorange: '#bf5700',
    white: '#FFFFFF',
    black: '#000000',
};

const NAV_LINKS = [
    { href: 'https://discord.gg/mybTUaf6jn', icon: 'ph-discord-logo' },
    { href: 'https://www.instagram.com/longhorndevelopers/', icon: 'ph-instagram-logo' },
    { href: 'https://www.linkedin.com/company/longhorn-developers/', icon: 'ph-linkedin-logo' },
    { href: 'https://github.com/Longhorn-Developers/UT-Lectures-Plus', icon: 'ph-github-logo' },
    { href: null, icon: 'ph-moon' },
    { href: null, icon: 'ph-gear' },
];

function injectStylesheets() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
        'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..900&family=Space+Grotesk:wght@300..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap';
    document.head.appendChild(link);
    const phosphor = document.createElement('link');
    phosphor.rel = 'stylesheet';
    phosphor.href = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css';
    document.head.appendChild(phosphor);
}

function removeElements(...selectors: string[]) {
    selectors.forEach(selector => document.querySelector<HTMLElement>(selector)?.remove());
}

function styleCourseBlock() {
    const h2List = document.querySelectorAll<HTMLElement>('h2');
    if (!h2List) return;
    h2List.forEach(h2 => {
        Object.assign(h2.style, {
            fontSize: '32px',
            fontWeight: '500',
            fontFamily: "'Space Grotesk'",
            color: COLORS.white,
            background: COLORS.burntorange,
            paddingTop: '15px',
            paddingBottom: '15px',
            paddingLeft: '20px',
            borderRadius: '4px',
        })
    });
}

function styleHeader() {
    const header = document.querySelector<HTMLElement>('h1');
    if (!header) return;

    header.innerHTML = `UT Lectures<span id="ut-plus">+</span>`;
    Object.assign(header.style, {
        fontFamily: "'Roboto Flex', sans-serif",
        fontSize: '48px',
        fontWeight: '700',
        marginBottom: '0',
    });

    const plus = document.querySelector<HTMLElement>('#ut-plus');
    if (plus) plus.style.color = COLORS.burntorange;
}

function buildHeaderRow() {
    const headerRow = document.querySelector<HTMLElement>('.row');
    if (!headerRow) return;

    headerRow.style.display = 'flex';
    headerRow.style.flexDirection = 'row';

    const infoDiv = document.createElement('div');
    Object.assign(infoDiv.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '28px',
        paddingRight: '15px',
    });

    const lhd_phrase = document.createElement('div');
    Object.assign(lhd_phrase.style, {
        display: 'flex',
        flexDirection: 'row',
    });

    const logo = document.createElement('img');
    logo.src = browser.runtime.getURL('/LHD_Logo_Hookem.svg');

    const phrase = document.createElement('div');
    Object.assign(phrase.style, {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: '16px',
        lineHeight: '17px',
        width: '224px',
        paddingLeft: '8px',
    });
    phrase.textContent = 'MADE WITH LOVE, BY\nLONGHORN DEVELOPERS';
    phrase.style.setProperty('color', COLORS.burntorange, 'important');

    lhd_phrase.append(logo, phrase);
    infoDiv.appendChild(lhd_phrase);

    const nav = document.createElement('nav');
    Object.assign(nav.style, {
        display: 'flex',
        flexDirection: 'row',
        gap: '18px',
        marginTop: '8px',
        marginRight: '20px',
        width: '224px',
    });

    NAV_LINKS.forEach(({ href, icon }) => {
        const a = document.createElement('a');
        if (href) {
            a.href = href;
            a.target = '_blank';
        } else {
            a.style.cursor = 'pointer';
        }

        const i = document.createElement('i');
        i.className = `ph ${icon}`;
        i.style.color = COLORS.black;
        i.style.fontSize = '24px';

        a.appendChild(i);
        nav.appendChild(a);
    });

    infoDiv.appendChild(nav);
    headerRow.appendChild(infoDiv);
}

function formatEpisodeTitles() {
    document.querySelectorAll<HTMLElement>('.episode_title').forEach(title => {
        title.textContent = formatLectureTitle(title.textContent);
    });
}

export default defineContentScript({
    matches: ['*://*.la.utexas.edu/player'],
    async main() {
        injectStylesheets();
        removeElements('h2', 'p', '#lo_logo', 'hr');

        const body = document.querySelector<HTMLElement>('body');
        if (body) body.style.padding = '65px 65px 130px 65px';

        styleHeader();
        styleCourseBlock();
        buildHeaderRow();

        const faq_link = document.querySelector<HTMLElement>(
            'a[href="https://sites.la.utexas.edu/lecturesonline/students/faq"]'
        );
        if (faq_link) faq_link.style.fontFamily = 'Roboto Flex';

        formatEpisodeTitles();
    },
});
