import { defineContentScript } from '#imports';
import { formatLectureTitle } from './utils';
export default defineContentScript({
    matches: ['*://*.la.utexas.edu/player'],
    async main() {
        const episode_titles = document.querySelectorAll<HTMLElement>('.episode_title');

        episode_titles.forEach(title => {
            const initialFormat = title.textContent;
            title.textContent = formatLectureTitle(initialFormat);
        });
    },
});
