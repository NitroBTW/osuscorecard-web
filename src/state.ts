// Import type definitions for API response types
import type { MapResponse, ScoreResponse } from "./types";

// Define the shape of the application state
export interface AppState {
    currentScoreData: ScoreResponse | null; // Currently loaded score data from the API, or null if not loaded
    currentMapData: MapResponse | null; // Currently loaded map data from the API, or null if not loaded
    gradientCanvas: HTMLCanvasElement | null; // Canvas element for rendering the star rating gradient
    gradientCtx: CanvasRenderingContext2D | null; // 2D rendering context for the gradient canvas
    smallScorecard: boolean; // Whether to render the scorecard in small mode
}

// Create the global application state object with default values
export const state: AppState = {
    currentScoreData: null,
    currentMapData: null,
    gradientCanvas: null,
    gradientCtx: null,
    smallScorecard: false,
};