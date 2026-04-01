// Status type for displaying messages to the user
export type StatusType = "loading" | "success" | "error";

// Represents a mod applied to a score
export interface Mod {
    acronym: string; // Two letter mod acronym
}

// Represents beatmap information
export interface Beatmap {
    id: number; // Beatmapset ID
    title: string; // Beatmap title
    difficulty: string; // Difficulty name
    creator: string; // Creator of the beatmap
    star_rating: number; // SR of the difficulty
    cover: string; // URL to the beatmap cover image
    status: string; // Ranked status of the beatmap
}

// Raw score data structure from the API
export interface RawScoreData {
    score: number; // Score value (lazer score or classic total)
    classic_score: number; // Classic score value
    c300: number; // Number of 300 hits
    c100: number; // Number of 100 hits
    c50: number; // Number of 50 hits
    misses: number; // Number of misses
    cEnds: number; // Number of slider end hits
    cSliders: number; // Total number of sliders in the beatmap
    max_combo: number; // Maximum combo achieved
    accuracy: number; // Accuracy as a decimal 
    pp: number; // Performance points earned
    rank: string; // Letter grade rank
    mods: Mod[]; // Array of mods applied to the score
    leaderboard: number; // Leaderboard position
    full_combo: boolean; // Whether the score was a full combo
}

// Raw user data structure from the API
export interface RawUserData {
    username: string; // Player username
    user_rank: number; // Global rank of the player
    avatar_url: string; // URL to the player's avatar image
    country: string; // Two letter country code
}

// Full API response for a score request
export interface ScoreResponse {
    lazer: boolean; // Whether this is a lazer score
    score: RawScoreData; // Score data including hits, accuracy, etc
    user: RawUserData; // User information for who achieved the score
    beatmap: Beatmap; // Beatmap information for the score
}

// Full API response for a map request
export interface MapResponse {
    beatmap: Beatmap;
}

// Response from the scorecard counter endpoint
export interface CounterResponse {
    count: number;
}

// Override fields for score data
export interface ScoreOverrides {
    score: string; // Override value for the score
    count300: string; // Override value for 300 count
    count100: string; // Override value for 100 count
    count50: string; // Override value for 50 count
    countMiss: string; // Override value for miss count
    countSliderEnds: string; // Override value for slider ends count
    combo: string; // Override value for max combo
    accuracy: string; // Override value for accuracy
    pp: string; // Override value for PP
    rank: string; // Override value for rank letter
    mods: string; // Override value for mods
    leaderboard: string; // Override value for leaderboard position
}

// Override fields for user data
export interface UserOverrides {
    username: string; // Override value for username
    userRank: string; // Override value for user rank
    avatarUrl: string; // Override value for avatar URL
}

// Extracted score data after applying overrides
export interface ExtractedScoreData {
    score: number; // Final score value
    classic_score: number; // Final classic score value
    c300: number; // Final 300 count
    c100: number; // Final 100 count
    c50: number; // Final 50 count
    misses: number; // Final miss count
    cEnds: number; // Final slider ends count
    cSliders: number; // Final slider count
    max_combo: number; // Final max combo
    accuracy: number; // Final accuracy
    pp: number; // Final PP value
    rank: string; // Final rank letter
    mods: Mod[]; // Final applied mods
    leaderboard: number; // Final leaderboard position
    full_combo: boolean; // Final full combo status
}

// Extracted user data after applying overrides
export interface ExtractedUserData {
    username: string; // Final username
    userRank: number; // Final user rank
    avatarUrl: string; // Final avatar URL
    country: string; // Final country code
}