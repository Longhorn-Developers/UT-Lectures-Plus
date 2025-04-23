export interface VttCue {
    id: string;
    start: number;
    end: number;
    text: string;
}

/**
 * Parses a WebVTT (Web Video Text Tracks) file
 *
 * @param vttContent - The content of the WebVTT file as a string.
 * @returns An array of VttCue objects, each representing a cue in the WebVTT file.
 */
const parseVtt = (vttContent: string): VttCue[] => {
    if (!vttContent) return [];

    const lines = vttContent.trim().split(/\n\s*\n/);

    // Remove first line if it's the WEBVTT header
    if (lines[0].startsWith('WEBVTT')) {
        lines.splice(0, 1);
    }

    const cues: VttCue[] = [];

    for (let i = 0; i < lines.length; i++) {
        // Each "line" is now a full cue block
        const cueBlock = lines[i].trim();
        if (!cueBlock) continue;

        const cueLines = cueBlock.split('\n');
        let id = '';
        let start = 0;
        let end = 0;
        let text = '';

        // First determine if the first line is an ID or timestamp
        let currentLineIndex = 0;

        // If first line doesn't contain "-->" it's an ID
        if (!cueLines[0].includes('-->')) {
            id = cueLines[0].trim();
            currentLineIndex++;
        } else {
            // Generate a default ID if none provided
            id = `cue-${i + 1}`;
        }

        // Parse timestamp line (should be current line or next line)
        if (currentLineIndex < cueLines.length && cueLines[currentLineIndex].includes('-->')) {
            const timestamps = cueLines[currentLineIndex].split('-->').map(t => t.trim());
            start = timestampToSeconds(timestamps[0]);
            end = timestampToSeconds(timestamps[1]);
            currentLineIndex++;
        }

        // Remaining lines are the text content
        const textLines = cueLines.slice(currentLineIndex);
        text = textLines.join(' ');

        // Add the cue if we have all required fields
        if (id && start !== undefined && end !== undefined && text) {
            cues.push({
                id,
                start,
                end,
                text,
            });
        }
    }

    return cues;
};

const timestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':');
    let seconds = 0;

    if (parts.length === 3) {
        // HH:MM:SS.mmm format
        seconds += parseInt(parts[0]) * 3600;
        seconds += parseInt(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
        // MM:SS.mmm format
        seconds += parseInt(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
    } else {
        // SS.mmm format
        seconds += parseFloat(parts[0]);
    }

    return seconds;
};

/**
 * Formats a time in seconds to a string in MM:SS format
 *
 * @param seconds - The time in seconds to format.
 * @returns A string representing the time in MM:SS format.
 */
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export { parseVtt, formatTime };
