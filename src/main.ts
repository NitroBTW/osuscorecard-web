import { fetchMapData, fetchScoreData } from "./api";
import { dom } from "./dom";
import { updateScorecard, loadGradientColours, populateOverrideFields, resetPreviewState, saveAsPNG, setStatus, toggleSliderEndsInput, updateCounterDisplay } from "./render";
import { state } from "./state";
import { setupInputValidation } from "./validation";
import { debounce, parseMapId, parseScoreId } from "./utils";

// Extend the global Window interface to include the toggleDropdown function
declare global {
    interface Window {
        toggleDropdown: () => void;
    }
}

// Toggle the visibility of the dropdown menu and update the arrow icon
function toggleDropdown(): void {
    const dropdownContent = dom.dropdownContent();
    const arrow = dom.dropdownArrow();

    if (
        dropdownContent.style.display === "none" ||
        dropdownContent.style.display === ""
    ) {
        dropdownContent.style.display = "block";
        arrow.textContent = "▲";
    } else {
        dropdownContent.style.display = "none";
        arrow.textContent = "▼";
    }
}

// Fetch and load score data from the API using the provided score ID
async function loadScore(scoreId: string): Promise<void> {
    try {
        setStatus("Loading score data...", "loading");

        // Fetch score data from the API
        const data = await fetchScoreData(scoreId);
        // Store the fetched score data in application state
        state.currentScoreData = data;
        // Clear any previously loaded map data
        state.currentMapData = null;

        // Show the score overrides section
        dom.scoreOverrides().style.display = "block";
        // Show the PP input group only for loved ranked maps
        dom.ppInputGroup().style.display =
            data.beatmap.status === "loved" ? "block" : "none";

        // Populate the override fields with the fetched data
        populateOverrideFields(data);
        // Update the scorecard display with the new data
        await updateScorecard();

        setStatus("Score loaded successfully!", "success");
    } catch (error) {
        console.error("Error fetching score:", error);
        // Clear the current score data on error
        state.currentScoreData = null;

        if (error instanceof Error) {
            setStatus(`Error: ${error.message}`, "error");
        } else {
            setStatus("Error: Failed to fetch score data.", "error");
        }

        // Hide the score overrides section on error
        dom.scoreOverrides().style.display = "none";
        resetPreviewState();
    }
}

// Fetch and load map data from the API using the provided map ID
async function loadMap(mapId: string): Promise<void> {
    try {
        setStatus("Loading map data...", "loading");

        // Fetch map data from the API
        const data = await fetchMapData(mapId);
        // Store the fetched map data in application state
        state.currentMapData = data;
        // Clear any previously loaded score data
        state.currentScoreData = null;

        // Show the score overrides section
        dom.scoreOverrides().style.display = "block";
        // Show the PP input group only for loved ranked maps
        dom.ppInputGroup().style.display =
            data.beatmap.status === "loved" ? "block" : "none";

        // Update the scorecard display with the new data
        await updateScorecard();

        setStatus("Map loaded successfully!", "success");
    } catch (error) {
        console.error("Error fetching map:", error);
        // Clear the current map data on error
        state.currentMapData = null;

        if (error instanceof Error) {
            setStatus(`Error: ${error.message}`, "error");
        } else {
            setStatus("Error: Failed to fetch map data.", "error");
        }

        // Hide the score overrides section on error
        dom.scoreOverrides().style.display = "none";
        resetPreviewState();
    }
}

// Bind input event listeners to the score and map ID input fields for auto loading
function bindFetchInputs(): void {
    // Create a debounced handler for score ID input that triggers after 500ms of no typing
    const handleScoreInput = debounce(async () => {
        const parsedId = parseScoreId(dom.scoreId().value);

        // Only proceed if a valid score ID was parsed
        if (!parsedId) {
            return;
        }

        await loadScore(parsedId);
    }, 500);

    // Create a debounced handler for map ID input that triggers after 500ms of no typing
    const handleMapInput = debounce(async () => {
        const parsedId = parseMapId(dom.mapId().value);

        // Only proceed if a valid map ID was parsed
        if (!parsedId) {
            return;
        }

        await loadMap(parsedId);
    }, 500);

    // Attach input event listeners to trigger loading when the user types
    dom.scoreId().addEventListener("input", () => {
        void handleScoreInput();
    });

    dom.mapId().addEventListener("input", () => {
        void handleMapInput();
    });
}

// Bind event listeners to all override input fields to update the scorecard in real-time
function bindLiveOverrideUpdates(): void {
    // List of all input elements that should trigger live updates
    const inputs: Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = [
        dom.extraText(),
        dom.backgroundOverride(),
        dom.ppOverride(),
        dom.scoreOverride(),
        dom.count300(),
        dom.count100(),
        dom.count50(),
        dom.countMiss(),
        dom.countSliderEnds(),
        dom.comboOverride(),
        dom.accuracyOverride(),
        dom.ppScoreOverride(),
        dom.rankOverride(),
        dom.modsOverride(),
        dom.leaderboardOverride(),
        dom.usernameOverride(),
        dom.userRankOverride(),
        dom.avatarUrlOverride(),
        dom.fullComboOverride(),
        dom.unrankedOverride(),
    ];

    // Create a debounced render function that waits 300ms after the last input
    const debouncedRender = debounce(async () => {
        if (state.currentScoreData || state.currentMapData) {
            await updateScorecard();
        }
    }, 300);

    // Attach input event listeners to all override fields
    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            void debouncedRender();
        });

        // Also listen for change events on checkboxes
        if (
            input instanceof HTMLInputElement &&
            input.type === "checkbox"
        ) {
            input.addEventListener("change", () => {
                if (state.currentScoreData || state.currentMapData) {
                    void updateScorecard();
                }
            });
        }

        // Also listen for change events on select dropdowns
        if (input instanceof HTMLSelectElement) {
            input.addEventListener("change", () => {
                if (state.currentScoreData || state.currentMapData) {
                    void updateScorecard();
                }
            });
        }
    });

    // Special handler for the lazer scoring toggle that also shows/hides the slider ends input
    dom.lazerScoringOverride().addEventListener("change", () => {
        toggleSliderEndsInput(dom.lazerScoringOverride().checked);

        if (state.currentScoreData || state.currentMapData) {
            void updateScorecard();
        }
    });

    // Handler for the small scorecard toggle
    dom.smallScorecardToggle().addEventListener("change", () => {
        // Store the small scorecard preference in state
        state.smallScorecard = dom.smallScorecardToggle().checked;

        if (state.currentScoreData || state.currentMapData) {
            void updateScorecard();
        }
    });
}

// Bind click event listener to the save button for PNG export
function bindActions(): void {
    dom.saveBtn().addEventListener("click", () => {
        void saveAsPNG();
    });
}

// Initialise the application on page load
async function init(): Promise<void> {
    // Expose the toggleDropdown function to the global window object for the onclick handler
    window.toggleDropdown = toggleDropdown;

    // Hide the score overrides section initially
    dom.scoreOverrides().style.display = "none";
    // Hide the slider ends input initially (lazer mode off by default)
    toggleSliderEndsInput(false);
    // Reset the preview to show placeholder state
    resetPreviewState();

    // Attempt to load gradient colours for the star rating display
    try {
        await loadGradientColours();
    } catch (error) {
        console.warn("Failed to load gradient, using fallback colours.", error);
    }

    // Set up input validation for all form fields
    setupInputValidation();
    // Fetch and display the current scorecard count
    await updateCounterDisplay();

    // Bind all event listeners
    bindFetchInputs();
    bindLiveOverrideUpdates();
    bindActions();
}

// Start the initialisation process
void init();