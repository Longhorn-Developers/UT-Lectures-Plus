/**
 * Converts a timestamp string in the format "HH:MM:SS.sss" or "MM:SS.sss" to milliseconds.
 *
 * @param timestamp - The timestamp string to convert. It can be in the format "HH:MM:SS.sss" or "MM:SS.sss".
 * @returns The total milliseconds represented by the timestamp.
 */
export function timestampToMilliseconds(timestamp: string): number {
    const splitted_time = timestamp.split(':');

    let hours = '0';
    let minutes = '0';
    let secondsWithMillis = '00.000';

    if (splitted_time.length === 3) {
        hours = splitted_time[0];
        minutes = splitted_time[1];
        secondsWithMillis = splitted_time[2];
    } else if (splitted_time.length === 2) {
        minutes = splitted_time[0];
        secondsWithMillis = splitted_time[1];
    }

    // console.log(secondsWithMillis)
    // Split secondsWithMillis into seconds and seconds
    const [seconds, milliseconds] = secondsWithMillis.split('.');

    // Calculate the total milliseconds
    const totalMilliseconds =
        parseInt(hours, 10) * 60 * 60 * 1000 + // hours to milliseconds
        parseInt(minutes, 10) * 60 * 1000 + // minutes to milliseconds
        parseInt(seconds, 10) * 1000 + // seconds to milliseconds
        parseInt(milliseconds, 10); // milliseconds

    return totalMilliseconds / 1000;
}
