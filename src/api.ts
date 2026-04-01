// Import type definitions for API response types
import type { CounterResponse, MapResponse, ScoreResponse } from "./types";

// Retrieve the base API URL from environment variables, defaulting to empty string
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Fetch score data from the API using a score ID
export async function fetchScoreData(scoreId: string): Promise<ScoreResponse> {
    const response = await fetch(`${API_BASE}/api/score/${scoreId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch score data.");
    }

    return (await response.json()) as ScoreResponse;
}

// Fetch map data from the API using a map ID
export async function fetchMapData(mapId: string): Promise<MapResponse> {
    const response = await fetch(`${API_BASE}/api/map/${mapId}`);

    if (!response.ok) {
        throw new Error(
            "Failed to fetch map data. Make sure you entered a valid ID or URL.",
        );
    }

    return (await response.json()) as MapResponse;
}

// Fetch the current scorecard generation count from the API
export async function fetchScorecardCount(): Promise<CounterResponse> {
    const response = await fetch(`${API_BASE}/api/scorecards/count`);

    if (!response.ok) {
        throw new Error("Failed to fetch scorecard count.");
    }

    return (await response.json()) as CounterResponse;
}

// Increment the scorecard generation counter on the server
export async function incrementScorecardCount(): Promise<void> {
    const response = await fetch(`${API_BASE}/api/scorecards/increment`, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error("Failed to increment scorecard count.");
    }
}

// Fetch an image from a URL and convert it to a data URL for embedding in the scorecard
export async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
    // Add a cache-busting query parameter to ensure we get fresh image data
    const bustUrl =
        imageUrl +
        (imageUrl.includes("?") ? "&" : "?") +
        `_dl=${Date.now()}`;

    const response = await fetch(bustUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Convert the image blob to a data URL using a FileReader
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            resolve(String(reader.result));
        };

        reader.onerror = () => {
            reject(new Error("Failed to convert image blob to data URL."));
        };

        reader.readAsDataURL(blob);
    });
}