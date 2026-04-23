/**
 * Formats a lecture video title to be in a more useful, digestible format.
 *
 * @param title - The original title of the lecture video to be formatted.
 * @returns A string that represents the formatted title in the following format:
 * Weekday, Month Day, Year Time
 * If input string does not have a match, the title is kept the same.
 */
function formatLectureTitle(raw: string): string | null {
    const timeMatch = raw.match(/\d+:\d+[ap]m/);
    const dateMatch = raw.match(/\((\d+)\/(\d+)\/(\d+)\)/);

    if (!timeMatch || !dateMatch) return null;

    const time = timeMatch[0];
    const [, month, day, year] = dateMatch;

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const parts = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).formatToParts(date);

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    return `${get('weekday')} ${get('month')} ${get('day')}, ${get('year')} ${time}`;
}

export { formatLectureTitle };
