// Import the Mod type definition
import type { Mod } from "./types";

// Extract the URL from a CSS background-image value
export function extractCssBackgroundUrl(backgroundImageValue: string): string {
    // Return empty string if no background image is set
    if (!backgroundImageValue || backgroundImageValue === "none") {
        return "";
    }

    // Use regex to extract the URL from url('...') or url("...")
    const match = backgroundImageValue.match(/url\(['"]?([^'"]+)['"]?\)/);

    // Return the extracted URL or empty string if no match
    return match ? match[1] : "";
}

// Format a number with thousand separators for display
export function formatScore(score: number): string {
    return score.toLocaleString();
}

// Format accuracy as a percentage string with 2 decimal places
export function formatAccuracy(accuracy: number): string {
    return (accuracy * 100).toFixed(2);
}

// Truncate text to a maximum length, adding ".." if truncated
export function truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
        ? text.substring(0, maxLength - 2) + ".."
        : text;
}

// Get a proxied image URL for the specified type (avatar or background)
export function getProxiedImageUrl(type: string, originalUrl: string): string {
    // Return empty string if no URL provided
    if (!originalUrl) {
        return "";
    }

    // Return a proxied URL through the backend API
    return `/api/proxy-image/${type}?url=${encodeURIComponent(originalUrl)}`;
}

// Parse a comma-separated string of mod acronyms into an array of Mod objects
export function parseModsString(modsString: string): Mod[] {
    // Return empty array for empty or whitespace-only input
    if (!modsString.trim()) {
        return [];
    }

    // Split by comma, trim whitespace, convert to uppercase, filter valid 2 letter codes
    return modsString
        .split(",")
        .map((mod) => mod.trim().toUpperCase())
        .filter((mod) => /^[A-Z]{2}$/.test(mod))
        .map((acronym) => ({ acronym }));
}

// Parse a score ID from user input (ID or full URL)
export function parseScoreId(input: string): string | null {
    const trimmed = input.trim();

    // If already numeric, return as is
    if (/^\d+$/.test(trimmed)) {
        return trimmed;
    }

    // Try to extract ID from direct score URL
    const directUrl =
        /^https?:\/\/osu\.ppy\.sh\/scores\/(\d+)(?:[/?#].*)?$/.exec(trimmed);

    if (directUrl) {
        return directUrl[1];
    }

    // Try to extract ID from mode specific score UR
    const modeUrl =
        /^https?:\/\/osu\.ppy\.sh\/scores\/[a-zA-Z0-9_-]+\/(\d+)(?:[/?#].*)?$/.exec(
            trimmed,
        );

    return modeUrl ? modeUrl[1] : null;
}

// Parse a map ID from user input (ID or full URL)
export function parseMapId(input: string): string | null {
    const trimmed = input.trim();

    // If already numeric, return as-is
    if (/^\d+$/.test(trimmed)) {
        return trimmed;
    }

    // Try to extract ID from beatmapset URL with difficulty
    const beatmapsetUrl =
        /^https?:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#\w+\/(\d+)(?:[/?#].*)?$/.exec(
            trimmed,
        );

    if (beatmapsetUrl) {
        return beatmapsetUrl[1];
    }

    // Try to extract ID from direct beatmap URL
    const beatmapUrl =
        /^https?:\/\/osu\.ppy\.sh\/beatmaps\/(\d+)(?:[/?#].*)?$/.exec(trimmed);

    return beatmapUrl ? beatmapUrl[1] : null;
}

// Escape HTML special characters to prevent XSS
export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// Sanitize a string for use in a filename by removing invalid characters
export function sanitizeFilename(value: string): string {
    // Replace invalid filename characters with underscores
    return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim() || "guest";
}

// Create a debounced version of a function that delays execution until after the specified delay
export function debounce<T extends (...args: never[]) => void>(
    fn: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timer: number | undefined;

    return (...args: Parameters<T>) => {
        // Clear any existing timer
        window.clearTimeout(timer);
        // Set a new timer to call the function after the delay
        timer = window.setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

// Calculate the width of text when rendered with a given font
export function getTextWidth(text: string, font: string): number {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Fallback to approximate width if canvas context is unavailable
    if (!context) {
        return text.length * 16;
    }

    // Set the font and measure the text
    context.font = font;

    return Math.ceil(context.measureText(text).width);
}