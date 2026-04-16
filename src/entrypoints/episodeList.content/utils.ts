/**
 * Formats a lecture video title to be in a more useful, digestible format.
 * 
 * @param title - The original title of the lecture video to be formatted.
 * @returns A string that represents the formatted title in the following format: 
 * Weekday, Month Day, Year Time
 * If input string does not have a match, the title is kept the same.
 */
const formatLectureTitle = (title: string): string => {
    const match = title?.match(/(?<time>\d+:\d+[ap]m)\s*\((?<month>\d+)\/(?<day>\d+)\/(?<year>\d+)\)/);

    if (match?.groups) {
        const { time, month, day, year } = match.groups;
        //time: "3:00pm", month: "01", day: "01", year: "2000"
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        const formatted = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return `${formatted} ${time}`;
    }

    return title;
}

export {formatLectureTitle}