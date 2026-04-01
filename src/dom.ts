// Helper function to retrieve a required DOM element by its ID, throwing an error if not found
function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }

    return element as T;
}

// Object containing factory functions to retrieve specific DOM elements from the page
export const dom = {
    scorecardCount: () => getRequiredElement<HTMLHeadingElement>("scorecard-count"), // Scorecard count heading element
    scoreId: () => getRequiredElement<HTMLInputElement>("scoreId"), // Score ID input element
    mapId: () => getRequiredElement<HTMLInputElement>("mapId"), // Map ID input element
    ppOverride: () => getRequiredElement<HTMLInputElement>("ppOverride"), // PP override input element
    extraText: () => getRequiredElement<HTMLTextAreaElement>("extraText"), // Extra text textarea element
    smallScorecardToggle: () => getRequiredElement<HTMLInputElement>("smallScorecardToggle"), // Small scorecard toggle checkbox element
    dropdownContent: () => getRequiredElement<HTMLDivElement>("dropdownContent"), // Dropdown content div element
    dropdownArrow: () => getRequiredElement<HTMLSpanElement>("arrow"), // Dropdown arrow span element
    ppInputGroup: () => getRequiredElement<HTMLDivElement>("ppInputGroup"), // PP input group div element
    scoreOverrides: () => getRequiredElement<HTMLDivElement>("scoreOverrides"), // Score overrides div element
    saveBtn: () => getRequiredElement<HTMLButtonElement>("saveBtn"), // Save button element
    status: () => getRequiredElement<HTMLDivElement>("status"), // Status div element
    preview: () => getRequiredElement<HTMLDivElement>("scorecard-preview"), // Scorecard preview div element
    placeholder: () => getRequiredElement<HTMLDivElement>("placeholder"), // Placeholder div element
    sliderEndsCol: () => getRequiredElement<HTMLDivElement>("sliderEndsCol"), // Slider ends column div element
    scoreOverride: () => getRequiredElement<HTMLInputElement>("scoreOverride"), // Score override input element
    count300: () => getRequiredElement<HTMLInputElement>("count300"), // 300 count input element
    count100: () => getRequiredElement<HTMLInputElement>("count100"), // 100 count input element
    count50: () => getRequiredElement<HTMLInputElement>("count50"), // 50 count input element
    countMiss: () => getRequiredElement<HTMLInputElement>("countMiss"), // Miss count input element
    countSliderEnds: () => getRequiredElement<HTMLInputElement>("countSliderEnds"), // Slider ends count input element
    comboOverride: () => getRequiredElement<HTMLInputElement>("comboOverride"), // Combo override input element
    accuracyOverride: () => getRequiredElement<HTMLInputElement>("accuracyOverride"), // Accuracy override input element
    ppScoreOverride: () => getRequiredElement<HTMLInputElement>("ppScoreOverride"), // PP score override input element
    rankOverride: () => getRequiredElement<HTMLSelectElement>("rankOverride"), // Rank override select element
    modsOverride: () => getRequiredElement<HTMLInputElement>("modsOverride"), // Mods override input element
    leaderboardOverride: () => getRequiredElement<HTMLInputElement>("leaderboardOverride"), // Leaderboard override input element
    fullComboOverride: () => getRequiredElement<HTMLInputElement>("fullComboOverride"), // Full combo override checkbox element
    lazerScoringOverride: () => getRequiredElement<HTMLInputElement>("lazerScoringOverride"), // Lazer scoring override checkbox element
    unrankedOverride: () => getRequiredElement<HTMLInputElement>("unrankedOverride"), // Unranked override checkbox element
    usernameOverride: () => getRequiredElement<HTMLInputElement>("usernameOverride"), // Username override input element
    userRankOverride: () => getRequiredElement<HTMLInputElement>("userRankOverride"), // User rank override input element
    avatarUrlOverride: () => getRequiredElement<HTMLInputElement>("avatarUrlOverride"), // Avatar URL override input element
    backgroundOverride: () => getRequiredElement<HTMLInputElement>("backgroundOverride"), // Background override input element
};

// Retrieve the generated scorecard container element if it exists
export function getGeneratedScorecard(): HTMLDivElement | null {
    return document.getElementById("generated-scorecard") as HTMLDivElement | null;
}