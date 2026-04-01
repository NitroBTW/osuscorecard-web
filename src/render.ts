import * as htmlToImage from "html-to-image";
import { fetchImageAsDataUrl, fetchScorecardCount, incrementScorecardCount } from "./api";
import { dom, getGeneratedScorecard } from "./dom";
import { state } from "./state";
import type {
    Beatmap,
    ExtractedScoreData,
    ExtractedUserData,
    MapResponse,
    ScoreOverrides,
    ScoreResponse,
    StatusType,
    UserOverrides,
} from "./types";
import {
    escapeHtml,
    extractCssBackgroundUrl,
    formatAccuracy,
    formatScore,
    getProxiedImageUrl,
    getTextWidth,
    parseModsString,
    sanitizeFilename,
    truncateText,
} from "./utils";

// Get the current beatmap from either score data or map data
function getCurrentBeatmap(): Beatmap | null {
    // If we have score data, return its beatmap
    if (state.currentScoreData) {
        return state.currentScoreData.beatmap;
    }

    // If we have map data, return its beatmap
    if (state.currentMapData) {
        return state.currentMapData.beatmap;
    }

    // No data available
    return null;
}

// Update the status message displayed to the user
export function setStatus(message: string, type: StatusType): void {
    const status = dom.status();
    status.textContent = message;
    // Set CSS class based on status type (loading, success, or error)
    status.className = `status-${type}`;
}

// Fetch and display the current scorecard generation count
export async function updateCounterDisplay(): Promise<void> {
    try {
        const data = await fetchScorecardCount();
        dom.scorecardCount().innerText = `Scorecards generated: ${data.count}`;
    } catch (error) {
        console.warn("Failed to update counter display", error);
    }
}

// Reset the preview area to its initial empty state
export function resetPreviewState(): void {
    // Hide the scorecard preview
    dom.preview().style.display = "none";
    // Show the placeholder message
    dom.placeholder().style.display = "block";
    // Disable the save button
    dom.saveBtn().disabled = true;
}

// Show the scorecard preview and enable the save button
export function showPreviewState(): void {
    // Show the scorecard preview
    dom.preview().style.display = "flex";
    // Hide the placeholder message
    dom.placeholder().style.display = "none";
    // Enable the save button
    dom.saveBtn().disabled = false;
}

// Show or hide the slider ends input based on lazer scoring mode
export function toggleSliderEndsInput(showSliderEnds: boolean): void {
    dom.sliderEndsCol().style.display = showSliderEnds ? "flex" : "none";
}

// Populate the override form fields with values from the fetched score data
export function populateOverrideFields(data: ScoreResponse): void {
    // Set placeholders for score related fields
    dom.scoreOverride().placeholder = formatScore(
        data.lazer ? data.score.score : data.score.classic_score,
    );
    dom.count300().placeholder = String(data.score.c300);
    dom.count100().placeholder = String(data.score.c100);
    dom.count50().placeholder = String(data.score.c50);
    dom.countMiss().placeholder = String(data.score.misses);
    dom.countSliderEnds().placeholder = String(data.score.cEnds);
    dom.comboOverride().placeholder = String(data.score.max_combo);
    dom.accuracyOverride().placeholder = formatAccuracy(data.score.accuracy);
    dom.ppScoreOverride().placeholder = String(Math.round(data.score.pp));
    dom.leaderboardOverride().placeholder = String(data.score.leaderboard);

    // Format mods as comma separated string
    const modsString = data.score.mods.map((mod) => mod.acronym).join(",");
    dom.modsOverride().placeholder = modsString || "No mods";

    // Set placeholders for user related fields
    dom.usernameOverride().placeholder = data.user.username;
    dom.userRankOverride().placeholder = String(data.user.user_rank);
    dom.avatarUrlOverride().placeholder = data.user.avatar_url;

    // Set checkbox states based on the score data
    dom.lazerScoringOverride().checked = data.lazer;
    toggleSliderEndsInput(data.lazer);
}

// Load the gradient image for star rating colour mapping
export async function loadGradientColours(): Promise<void> {
    const img = new Image();
    // Set cross origin to allow canvas to read pixel data from the image
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
        img.onload = () => {
            // Create a canvas to store the gradient image data
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Failed to get 2D context for gradient."));
                return;
            }

            // Set canvas size to match the image and draw the image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Store the canvas and context in state for later use
            state.gradientCanvas = canvas;
            state.gradientCtx = ctx;
            resolve();
        };

        img.onerror = () => {
            reject(new Error("Failed to load gradient image."));
        };

        // Load the gradient image from the public folder
        img.src = "/gradient.png";
    });
}

// Get the colour for a given star rating from the gradient or fallback to a fixed colour
export function getGradientColour(starRating: number): string {
    // If gradient is not loaded, use a fixed colour map based on integer star rating
    if (!state.gradientCanvas || !state.gradientCtx) {
        const colourMap: Record<number, string> = {
            0: "#666666",
            1: "#4FC3F7",
            2: "#4CAF50",
            3: "#FFEB3B",
            4: "#FF9800",
            5: "#FF5722",
            6: "#E91E63",
            7: "#9C27B0",
            8: "#673AB7",
            9: "#3F51B5",
            10: "#000000",
        };

        const index = Math.min(Math.floor(starRating), 10);
        return colourMap[index] || "#ff6b6b";
    }

    // Calculate position in the gradient based on star rating (0-10 mapped to 0-1)
    const clamped = Math.max(0, Math.min(10, starRating));
    const position = clamped / 10;
    // Calculate x position in the canvas
    const x = Math.floor(position * (state.gradientCanvas.width - 1));
    const y = Math.floor(state.gradientCanvas.height / 2);

    try {
        // Sample the pixel colour at the calculated position
        const pixel = state.gradientCtx.getImageData(x, y, 1, 1).data;

        // Convert RGB values to hex colour string
        return `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1]
            .toString(16)
            .padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
    } catch (error) {
        console.error("Error sampling gradient:", error);
        return "#ff6b6b";
    }
}

// Read all score override values from the form fields
function getScoreOverrides(): ScoreOverrides {
    return {
        score: dom.scoreOverride().value,
        count300: dom.count300().value,
        count100: dom.count100().value,
        count50: dom.count50().value,
        countMiss: dom.countMiss().value,
        countSliderEnds: dom.countSliderEnds().value,
        combo: dom.comboOverride().value,
        accuracy: dom.accuracyOverride().value,
        pp: dom.ppScoreOverride().value,
        rank: dom.rankOverride().value,
        mods: dom.modsOverride().value,
        leaderboard: dom.leaderboardOverride().value,
    };
}

// Read all user override values from the form fields
function getUserOverrides(): UserOverrides {
    return {
        username: dom.usernameOverride().value,
        userRank: dom.userRankOverride().value,
        avatarUrl: dom.avatarUrlOverride().value,
    };
}

// Extract score data, applying overrides if provided, otherwise using API data
function extractScoreData(): ExtractedScoreData | null {
    const overrides = getScoreOverrides();

    // If we have score data from the API, merge with overrides
    if (state.currentScoreData) {
        const data = state.currentScoreData;

        return {
            // Use override if provided, otherwise use API data (lazer or classic score)
            score:
                overrides.score !== ""
                    ? Number.parseInt(overrides.score, 10)
                    : data.lazer
                      ? data.score.score
                      : data.score.classic_score,
            classic_score:
                overrides.score !== ""
                    ? Number.parseInt(overrides.score, 10)
                    : data.score.classic_score,
            // Apply overrides to hit counts
            c300:
                overrides.count300 !== ""
                    ? Number.parseInt(overrides.count300, 10)
                    : data.score.c300,
            c100:
                overrides.count100 !== ""
                    ? Number.parseInt(overrides.count100, 10)
                    : data.score.c100,
            c50:
                overrides.count50 !== ""
                    ? Number.parseInt(overrides.count50, 10)
                    : data.score.c50,
            misses:
                overrides.countMiss !== ""
                    ? Number.parseInt(overrides.countMiss, 10)
                    : data.score.misses,
            cEnds:
                overrides.countSliderEnds !== ""
                    ? Number.parseInt(overrides.countSliderEnds, 10)
                    : data.score.cEnds,
            cSliders: data.score.cSliders,
            max_combo:
                overrides.combo !== ""
                    ? Number.parseInt(overrides.combo, 10)
                    : data.score.max_combo,
            // Override accuracy requires division by 100 (form input is percentage)
            accuracy:
                overrides.accuracy !== ""
                    ? Number.parseFloat(overrides.accuracy) / 100
                    : data.score.accuracy,
            pp:
                overrides.pp !== ""
                    ? Number.parseFloat(overrides.pp)
                    : data.score.pp,
            rank: overrides.rank !== "" ? overrides.rank : data.score.rank,
            // Parse mods string into array of mod objects
            mods:
                overrides.mods !== ""
                    ? parseModsString(overrides.mods)
                    : data.score.mods,
            leaderboard:
                overrides.leaderboard !== ""
                    ? Number.parseInt(overrides.leaderboard, 10)
                    : data.score.leaderboard,
            full_combo: data.score.full_combo,
        };
    }

    // If we have map data only (no score), use default/override values with zero defaults
    if (state.currentMapData) {
        return {
            score:
                overrides.score !== ""
                    ? Number.parseInt(overrides.score, 10)
                    : 0,
            classic_score:
                overrides.score !== ""
                    ? Number.parseInt(overrides.score, 10)
                    : 0,
            c300:
                overrides.count300 !== ""
                    ? Number.parseInt(overrides.count300, 10)
                    : 0,
            c100:
                overrides.count100 !== ""
                    ? Number.parseInt(overrides.count100, 10)
                    : 0,
            c50:
                overrides.count50 !== ""
                    ? Number.parseInt(overrides.count50, 10)
                    : 0,
            misses:
                overrides.countMiss !== ""
                    ? Number.parseInt(overrides.countMiss, 10)
                    : 0,
            cEnds:
                overrides.countSliderEnds !== ""
                    ? Number.parseInt(overrides.countSliderEnds, 10)
                    : 0,
            cSliders: 100,
            max_combo:
                overrides.combo !== ""
                    ? Number.parseInt(overrides.combo, 10)
                    : 0,
            accuracy:
                overrides.accuracy !== ""
                    ? Number.parseFloat(overrides.accuracy) / 100
                    : 0,
            pp:
                overrides.pp !== ""
                    ? Number.parseFloat(overrides.pp)
                    : 0,
            rank: overrides.rank !== "" ? overrides.rank : "F",
            mods:
                overrides.mods !== ""
                    ? parseModsString(overrides.mods)
                    : [],
            leaderboard:
                overrides.leaderboard !== ""
                    ? Number.parseInt(overrides.leaderboard, 10)
                    : 0,
            full_combo: false,
        };
    }

    return null;
}

// Extract user data, applying overrides if provided, otherwise using API data
function extractUserData(): ExtractedUserData | null {
    const overrides = getUserOverrides();

    // If we have score data from the API, merge with overrides
    if (state.currentScoreData) {
        const data = state.currentScoreData;

        return {
            username:
                overrides.username !== "" ? overrides.username : data.user.username,
            userRank:
                overrides.userRank !== ""
                    ? Number.parseInt(overrides.userRank, 10)
                    : data.user.user_rank,
            avatarUrl:
                overrides.avatarUrl !== ""
                    ? overrides.avatarUrl
                    : data.user.avatar_url,
            country: data.user.country,
        };
    }

    // If we have map data only (no score), use default values
    if (state.currentMapData) {
        // Default avatar for guests
        const defaultAvatarUrl = "https://osu.ppy.sh/images/layout/avatar-guest.png";

        return {
            username: overrides.username || "Guest",
            userRank: overrides.userRank
                ? Number.parseInt(overrides.userRank, 10)
                : 0,
            avatarUrl: overrides.avatarUrl || defaultAvatarUrl,
            country: "xx",
        };
    }

    return null;
}

// Generate the PP display string based on score data and map status
function getPpDisplay(scoreData: ExtractedScoreData, isLoved: boolean): string {
    // Check if user provided a PP override
    const ppOverride = dom.ppOverride().value;

    // For loved maps, show a heart instead of PP, or PP with heart if override provided
    if (isLoved) {
        if (ppOverride === "" || ppOverride === null) {
            return "♥";
        }

        return `${formatScore(Math.round(Number.parseFloat(ppOverride)))}pp ♥`;
    }

    // For non-loved maps, show the PP value
    return `${formatScore(Math.round(scoreData.pp))}pp`;
}

// Get the background image URL, using override if provided, otherwise from beatmap
async function getBackgroundUrl(): Promise<string> {
    // Check for background override first
    const backgroundOverride = dom.backgroundOverride().value.trim();
    if (backgroundOverride) {
        return getProxiedImageUrl("background", backgroundOverride);
    }

    // Fall back to beatmap cover
    const beatmap = getCurrentBeatmap();
    if (!beatmap) return "";

    return getProxiedImageUrl("background", beatmap.cover);
}

// Generate HTML for mod icons based on the applied mods
function generateModIconsHtml(mods: { acronym: string }[]): string {
    // Return empty string if no mods
    if (!mods.length) {
        return "";
    }

    // Generate a div for each mod with background image
    return mods
        .map(
            (mod) =>
                `<div class="mod-icon" style="background-image: url('/icons/${mod.acronym}.png')"></div>`,
        )
        .join("");
}

// Generate HTML for hit counts (300s, 100s, 50s, misses, slider ends, combo, accuracy)
// Different layout for lazer scoring vs classic scoring
function generateHitCountsHtml(
    scoreData: ExtractedScoreData,
    isLazer: boolean,
): string {
    // Lazer scoring includes slider ends and uses a different layout
    if (isLazer) {
        return `
            <div class="hit-count-row">
                <div class="stat stat-300">
                    <span class="label">300</span>
                    <span class="value">${scoreData.c300}</span>
                </div>
                <div class="stat stat-100">
                    <span class="label">100</span>
                    <span class="value">${scoreData.c100}</span>
                </div>
                <div class="stat stat-50">
                    <span class="label">50</span>
                    <span class="value">${scoreData.c50}</span>
                </div>
            </div>
            <div class="hit-count-row">
                <div class="stat stat-miss">
                    <span class="label">Miss</span>
                    <span class="value">${scoreData.misses}</span>
                </div>
                <div class="stat stat-sliderend">
                    <span class="label">Slider Ends</span>
                    <span class="value">${scoreData.cEnds}/${scoreData.cSliders}</span>
                </div>
            </div>
            <div class="hit-count-row">
                <div class="stat stat-combo">
                    <span class="label">Combo</span>
                    <span class="value">${formatScore(scoreData.max_combo)}x</span>
                </div>
                <div class="stat stat-accuracy">
                    <span class="label">Accuracy</span>
                    <span class="value">${formatAccuracy(scoreData.accuracy)}%</span>
                </div>
            </div>
        `;
    }

    // Classic scoring doesn't have slider ends, different layout
    return `
        <div class="hit-count-row">
            <div class="stat stat-300">
                <span class="label">300</span>
                <span class="value">${scoreData.c300}</span>
            </div>
            <div class="stat stat-100">
                <span class="label">100</span>
                <span class="value">${scoreData.c100}</span>
            </div>
        </div>
        <div class="hit-count-row">
            <div class="stat stat-50">
                <span class="label">50</span>
                <span class="value">${scoreData.c50}</span>
            </div>
            <div class="stat stat-miss">
                <span class="label">Miss</span>
                <span class="value">${scoreData.misses}</span>
            </div>
        </div>
        <div class="hit-count-row">
            <div class="stat stat-combo">
                <span class="label">Combo</span>
                <span class="value">${formatScore(scoreData.max_combo)}x</span>
            </div>
            <div class="stat stat-accuracy">
                <span class="label">Accuracy</span>
                <span class="value">${formatAccuracy(scoreData.accuracy)}%</span>
            </div>
        </div>
    `;
}

// Calculate the available width for the title element on the scorecard
function calculateTitleSpace(scorecard: HTMLElement): number {
    // Get all mod icons and calculate their total width (70px each)
    const modIcons = scorecard.querySelectorAll(".mod-icon");
    const modIconsWidth = modIcons.length * 70;
    // Horizontal padding on the scorecard (20px on each side)
    const horizontalPadding = 40;
    // Extra spacing if there are mod icons
    const minSpacing = modIcons.length > 0 ? 20 : 0;
    // Available width is total width minus padding, mod icons, and spacing
    const availableWidth = 800 - horizontalPadding - modIconsWidth - minSpacing;

    // Ensure at least 200px for the title
    return Math.max(200, availableWidth);
}

// Adjust the title size to fit within the available space, truncating if necessary
function adjustTitleSize(scorecard: HTMLElement, title: string): string {
    const titleElement = scorecard.querySelector(".map-title");

    // Return original title if element not found
    if (!titleElement) {
        return title;
    }

    // Calculate how much space is available for the title
    const availableWidth = calculateTitleSpace(scorecard);
    // Font used for the title
    const font = `600 35px "Fredoka", cursive`;
    const ellipsis = "..";

    // If title fits, return as is
    if (getTextWidth(title, font) <= availableWidth) {
        return title;
    }

    // Truncate from the end until it fits
    let truncatedTitle = title;

    while (
        getTextWidth(truncatedTitle + ellipsis, font) > availableWidth &&
        truncatedTitle.length > 5
    ) {
        truncatedTitle = truncatedTitle.slice(0, -1);
    }

    // Add ellipsis if we actually truncated
    return truncatedTitle.length < title.length
        ? truncatedTitle + ellipsis
        : truncatedTitle;
}

// Calculate the required height for the scorecard based on extra text and full combo status
function calculateRequiredHeight(extraText: string, hasFullCombo: boolean): number {
    // Base height for the scorecard
    const baseHeight = 600;
    let additionalHeight = 0;

    // Add height for extra text based on number of line breaks
    if (extraText) {
        const lines = extraText.split("<br>").length;

        if (lines > 2) {
            additionalHeight += (lines - 2) * 30;
        }
    }

    // Add height if content overflows when theres a full combo
    if (hasFullCombo) {
        const rightSection = getGeneratedScorecard()?.querySelector(".right-section");

        if (rightSection instanceof HTMLElement) {
            const contentHeight = rightSection.scrollHeight;
            const containerHeight = rightSection.clientHeight;

            if (contentHeight > containerHeight) {
                additionalHeight += Math.max(
                    0,
                    contentHeight - containerHeight + 20,
                );
            }
        }
    }

    return baseHeight + additionalHeight;
}

// Adjust the scorecard height based on content
function adjustScorecardHeight(extraText: string, hasFullCombo: boolean): void {
    const scorecard = getGeneratedScorecard();

    // Don't adjust height for small scorecards
    if (!scorecard || state.smallScorecard) {
        return;
    }

    const requiredHeight = calculateRequiredHeight(extraText, hasFullCombo);
    scorecard.style.height = `${requiredHeight}px`;
}

// Generate the HTML for the scorecard based on all the provided data
function generateScorecardHtml(args: {
    scoreData: ExtractedScoreData;
    userData: ExtractedUserData;
    beatmap: Beatmap;
    isLazer: boolean;
    ppDisplay: string;
    fullComboText: string;
    extraText: string;
    avatarUrl: string;
    leaderboardDisplay: string;
}): string {
    const {
        scoreData,
        userData,
        beatmap,
        isLazer,
        ppDisplay,
        fullComboText,
        extraText,
        avatarUrl,
        leaderboardDisplay,
    } = args;

    // Get the star rating colour from the gradient
    const starColour = getGradientColour(beatmap.star_rating);
    // Determine text colour based on star rating (light text for ratings over 6.5)
    const srColour = beatmap.star_rating > 6.5 ? "ffe475" : "2c3b43";

    // Generate the small scorecard layout
    if (state.smallScorecard) {
        return `
            <div class="top-bar">
                <div class="header">
                    <div class="map-info">
                        <div class="map-title">${escapeHtml(beatmap.title)}</div>
                        <div class="star-container">
                            <div class="star-rating" style="background: ${starColour}; color: #${srColour}">
                                ★ ${beatmap.star_rating.toFixed(2)}&nbsp;
                            </div>
                            <div class="mapper">
                                <span class="map-diff">${escapeHtml(
                                    truncateText(beatmap.difficulty, 32),
                                )} </span>
                                <span class="mapped-by">Mapped by: </span>
                                <span class="mapper">${escapeHtml(beatmap.creator)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mod-icons">
                        ${generateModIconsHtml(scoreData.mods)}
                    </div>
                </div>
            </div>
            <div class="bottom-bar">
                <div class="bottom-section">
                    <div class="rank-badge rank-${escapeHtml(scoreData.rank)}"></div>
                    <div class="stat stat-combo">
                        <span class="label">Combo</span>
                        <span class="value">${formatScore(scoreData.max_combo)}x</span>
                    </div>
                    <div class="stat stat-accuracy">
                        <span class="label">Accuracy</span>
                        <span class="value">${formatAccuracy(scoreData.accuracy)}%</span>
                    </div>
                    <div class="performance">
                        <span class="pp">${escapeHtml(ppDisplay)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate the full scorecard layout
    return `
        <div class="top-bar">
            <div class="header">
                <div class="map-info">
                    <div class="map-title">${escapeHtml(beatmap.title)}</div>
                    <div class="star-container">
                        <div class="star-rating" style="background: ${starColour}; color: #${srColour}">
                            ★ ${beatmap.star_rating.toFixed(2)}&nbsp;
                        </div>
                        <div class="mapper">
                            <span class="map-diff">${escapeHtml(
                                truncateText(beatmap.difficulty, 32),
                            )} </span>
                            <span class="mapped-by">Mapped by: </span>
                            <span class="mapper">${escapeHtml(beatmap.creator)}</span>
                        </div>
                    </div>
                </div>
                <div class="mod-icons">
                    ${generateModIconsHtml(scoreData.mods)}
                </div>
            </div>
        </div>
        <div class="middle-section">
            <div class="background-image">
                <img class="bg-img" src="" alt="" crossorigin="anonymous">
            </div>
            <div class="background-overlay"></div>
            <div class="main-content">
                <div class="left-section">
                    <div class="stats">
                        <div class="score">
                            Score: ${formatScore(
                                isLazer
                                    ? scoreData.score
                                    : scoreData.classic_score || scoreData.score,
                            )}
                        </div>
                        <div class="hit-counts">
                            ${generateHitCountsHtml(scoreData, isLazer)}
                        </div>
                    </div>
                </div>
                <div class="right-section">
                    <div class="rank-badge rank-${escapeHtml(scoreData.rank)}"></div>
                    <div class="performance">
                        <div></div>
                        <div class="full-combo">${escapeHtml(fullComboText)}</div>
                        <div></div>
                        <div class="pp">${escapeHtml(ppDisplay)}</div>
                        <div class="extra">${extraText}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom-bar">
            <div class="bottom-section">
                <div class="user-info">
                    <div class="avatar-container">
                        <img src="${avatarUrl}" alt="Avatar" class="avatar" crossorigin="anonymous">
                        <div class="flag" style="background-image: url('/flags/${escapeHtml(
                            userData.country.toLowerCase(),
                        )}.png')"></div>
                    </div>
                    <div class="user-details">
                        <div class="username">${escapeHtml(userData.username)}</div>
                        <div class="user-rank">#${formatScore(userData.userRank)}</div>
                    </div>
                </div>
                <div class="leaderboard-details">
                    <div class="leaderboard">Leaderboard</div>
                    <div class="leaderboard-rank">#${escapeHtml(
                        leaderboardDisplay,
                    )}</div>
                </div>
            </div>
        </div>
    `;
}

// Apply a background image data URL to the scorecard element
async function applyBackgroundDataUrl(
    scorecard: HTMLElement,
    sourceUrl: string,
): Promise<void> {
    try {
        // Find the background image element within the scorecard
        const imgEl = scorecard.querySelector(
            ".background-image img.bg-img",
        ) as HTMLImageElement | null;

        if (!imgEl) {
            return;
        }

        // Fetch the image and convert to data URL
        const dataUrl = await fetchImageAsDataUrl(sourceUrl);
        imgEl.src = dataUrl;
    } catch (error) {
        console.warn("Failed to apply background data URL", error);
    }
}

// Apply an avatar image data URL to the scorecard element
async function applyAvatarDataUrl(
    scorecard: HTMLElement,
    sourceUrl: string,
): Promise<void> {
    try {
        // Find the avatar image element within the scorecard
        const imgEl = scorecard.querySelector(
            ".avatar-container img.avatar",
        ) as HTMLImageElement | null;

        if (!imgEl) {
            return;
        }

        // Fetch the image and convert to data URL
        const dataUrl = await fetchImageAsDataUrl(sourceUrl);
        imgEl.src = dataUrl;
    } catch (error) {
        console.warn("Failed to apply avatar data URL", error);
    }
}

// Main function to update the scorecard display with current state and overrides
export async function updateScorecard(): Promise<void> {
    // Get data from either current score or current map
    const data: ScoreResponse | MapResponse | null =
        state.currentScoreData || state.currentMapData;

    // Reset if no data is available
    if (!data) {
        resetPreviewState();
        return;
    }

    // Get override values from form fields
    const extraText = escapeHtml(dom.extraText().value).replace(/\n/g, "<br>");
    const fullComboOverride = dom.fullComboOverride().checked;
    const lazerScoringOverride = dom.lazerScoringOverride().checked;
    const unrankedOverride = dom.unrankedOverride().checked;

    // Extract score and user data with overrides applied
    const scoreData = extractScoreData();
    const userData = extractUserData();
    const beatmap = getCurrentBeatmap();

    // Reset if any required data is missing
    if (!scoreData || !userData || !beatmap) {
        resetPreviewState();
        return;
    }

    // Format leaderboard display, show "UNRANKED" if unranked override is set
    const leaderboardDisplay = unrankedOverride
        ? "UNRANKED"
        : formatScore(scoreData.leaderboard);

    // Determine PP display based on map status and overrides
    const isLoved = beatmap.status === "loved";
    const isLazer = lazerScoringOverride;
    const ppDisplay = getPpDisplay(scoreData, isLoved);
    // Show FC text if override is set or actual score was a full combo
    const fullComboText =
        fullComboOverride || (state.currentScoreData && scoreData.full_combo)
            ? "Full Combo!"
            : "";

    // Get background and avatar URLs through the proxy
    const backgroundUrl = await getBackgroundUrl();
    const avatarUrl = getProxiedImageUrl("avatar", userData.avatarUrl);

    // Generate the HTML for the scorecard
    const scorecardHtml = generateScorecardHtml({
        scoreData,
        userData,
        beatmap,
        isLazer,
        ppDisplay,
        fullComboText,
        extraText,
        avatarUrl,
        leaderboardDisplay,
    });

    // Insert the generated HTML into the preview container
    const preview = dom.preview();
    preview.innerHTML = `
        <div id="generated-scorecard" class="${state.smallScorecard ? "scorecard small-scorecard" : "scorecard"}">
            ${scorecardHtml}
        </div>
    `;

    // Show the preview state
    showPreviewState();

    // Get reference to the generated scorecard element
    const generated = getGeneratedScorecard();

    if (!generated) {
        return;
    }

    // Adjust the title size to fit within available space
    const titleElement = generated.querySelector(".map-title");

    if (titleElement) {
        titleElement.textContent = adjustTitleSize(generated, beatmap.title);
    }

    // Adjust the scorecard height based on content
    adjustScorecardHeight(extraText, fullComboText !== "");

    // Load the background image asynchronously
    const bgImgEl = generated.querySelector(".background-image img.bg-img");
    if (bgImgEl && backgroundUrl) {
        void applyBackgroundDataUrl(generated, backgroundUrl);
    }

    // Load the avatar image asynchronously
    const avatarImgEl = generated.querySelector(".avatar-container img.avatar");
    if (avatarImgEl && avatarUrl) {
        void applyAvatarDataUrl(generated, avatarUrl);
    }
}

// Wait for all images to finish loading
function waitForImages(element: HTMLElement): Promise<unknown[]> {
    // Find all img elements
    const images = element.querySelectorAll("img");
    // Find all elements with background image style
    const backgroundElements = element.querySelectorAll('[style*="background-image"]');

    // Create promises for all img elements
    const imagePromises = Array.from(images).map((img) => {
        // If already loaded, resolve immediately
        if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
        }

        // Wait for the image to load with a timeout
        return new Promise<void>((resolve) => {
            const timeout = window.setTimeout(() => {
                console.warn("Image load timeout:", img.src);
                resolve();
            }, 5000);

            img.onload = () => {
                window.clearTimeout(timeout);
                resolve();
            };

            img.onerror = () => {
                window.clearTimeout(timeout);
                console.warn("Image failed to load:", img.src);
                resolve();
            };
        });
    });

    // Create promises for background images
    const backgroundPromises = Array.from(backgroundElements).map((element) => {
        const style = window.getComputedStyle(element);
        const bgImage = style.backgroundImage;

        if (bgImage && bgImage !== "none") {
            return new Promise<void>((resolve) => {
                const img = new Image();

                img.onload = () => {
                    resolve();
                };

                img.onerror = () => {
                    console.warn(
                        "Background image failed:",
                        extractCssBackgroundUrl(bgImage),
                    );
                    resolve();
                };

                const extracted = extractCssBackgroundUrl(bgImage);

                if (extracted) {
                    img.src = extracted;
                } else {
                    resolve();
                }
            });
        }

        return Promise.resolve();
    });

    // Wait for all images to load
    return Promise.all([...imagePromises, ...backgroundPromises]);
}

// Export the scorecard as a PNG image and increment the counter
export async function saveAsPNG(): Promise<void> {
    const scorecard = getGeneratedScorecard();

    if (!scorecard) {
        setStatus("No scorecard to save", "error");
        return;
    }

    try {
        setStatus("Generating PNG...", "loading");
        await waitForImages(scorecard);

        const fontResponse = await fetch('/Fredoka.ttf');
        const fontBlob = await fontResponse.blob();
        const fontBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(fontBlob);
        });

        const dataUrl = await htmlToImage.toPng(scorecard, {
            skipFonts: true,
            fontEmbedCSS: `
                @font-face {
                    font-family: 'Fredoka';
                    font-style: normal;
                    font-weight: 300 700;
                    src: url('${fontBase64}') format('truetype');
                }
            `,
        });

        // Try to increment the scorecard counter on the server
        try {
            await incrementScorecardCount();
            await updateCounterDisplay();
        } catch (error) {
            console.warn("Failed to update scorecard count after save", error);
        }

        // Generate a filename based on username and timestamp
        const timestamp = Date.now().toString().slice(-6);
        const username = state.currentScoreData
            ? state.currentScoreData.user.username
            : "guest";
        const filename = `scorecard_${sanitizeFilename(username)}_${timestamp}.png`;

        // Create a download link and trigger the download
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatus("PNG saved successfully!", "success");
    } catch (error) {
        console.error("Error saving PNG:", error);

        if (error instanceof Error) {
            setStatus(`Error saving PNG: ${error.message}`, "error");
        } else {
            setStatus("Error saving PNG: Unknown error", "error");
        }
    }
}