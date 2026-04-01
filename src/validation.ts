import { dom } from "./dom";
import { parseMapId, parseScoreId } from "./utils";

// Set the input element to a valid state
function setValidState(element: HTMLInputElement | HTMLSelectElement): void {
    element.style.borderColor = "#4CAF50";
    element.style.backgroundColor = "";
}

// Set the input element to an invalid state
function setInvalidState(element: HTMLInputElement | HTMLSelectElement): void {
    element.style.borderColor = "#f44336";
    element.style.backgroundColor = "#2c1a1dff";
}

// Set up real-time input validation for all form fields
export function setupInputValidation(): void {
    // Get references to the input elements
    const scoreIdInput = dom.scoreId();
    const mapIdInput = dom.mapId();
    const modsInput = dom.modsOverride();
    const accuracyInput = dom.accuracyOverride();
    const ppInput = dom.ppScoreOverride();
    const scoreInput = dom.scoreOverride();
    const usernameInput = dom.usernameOverride();
    const avatarInput = dom.avatarUrlOverride();

    // Validate score ID input on every keystroke
    scoreIdInput.addEventListener("input", () => {
        const parsed = parseScoreId(scoreIdInput.value);

        // Clear styling if input is empty
        if (!scoreIdInput.value.trim()) {
            scoreIdInput.style.borderColor = "";
            scoreIdInput.style.backgroundColor = "";
            return;
        }

        // Show valid or invalid state based on parsing result
        if (parsed) {
            setValidState(scoreIdInput);
        } else {
            setInvalidState(scoreIdInput);
        }
    });

    // Validate map ID input on every keystroke
    mapIdInput.addEventListener("input", () => {
        const parsed = parseMapId(mapIdInput.value);

        // Clear styling if input is empty
        if (!mapIdInput.value.trim()) {
            mapIdInput.style.borderColor = "";
            mapIdInput.style.backgroundColor = "";
            return;
        }

        // Show valid or invalid state based on parsing result
        if (parsed) {
            setValidState(mapIdInput);
        } else {
            setInvalidState(mapIdInput);
        }
    });

    // Validate mods input by converting to uppercase and checking format
    modsInput.addEventListener("input", () => {
        const value = modsInput.value.toUpperCase();
        modsInput.value = value;

        // Allow empty, single 2 letter code, comma-separated 2 letter codes, or trailing comma
        if (
            value === "" ||
            /^([A-Z]{2})(,[A-Z]{2})*$/.test(value) ||
            /^[A-Z]{1}$/.test(value) ||
            /^[A-Z]{2},$/.test(value)
        ) {
            setValidState(modsInput);
        } else if (value.length > 2 && !value.includes(",")) {
            // Invalid if too long and no comma separator
            setInvalidState(modsInput);
        }
    });

    // Clean up mods input when user leaves the field
    modsInput.addEventListener("blur", () => {
        const value = modsInput.value.toUpperCase();

        // Filter out invalid mod codes
        if (value !== "") {
            const cleaned = value
                .split(",")
                .map((part) => part.trim())
                .filter((part) => /^[A-Z]{2}$/.test(part))
                .join(",");

            modsInput.value = cleaned;
        }

        // Final validation check
        if (modsInput.value === "" || /^([A-Z]{2})(,[A-Z]{2})*$/.test(modsInput.value)) {
            setValidState(modsInput);
        } else {
            setInvalidState(modsInput);
        }
    });

    // Clamp accuracy input between 0 and 100
    accuracyInput.addEventListener("input", () => {
        const value = Number.parseFloat(accuracyInput.value);

        if (Number.isNaN(value)) {
            return;
        }

        // Prevent values below 0
        if (value < 0) {
            accuracyInput.value = "0";
        }

        // Prevent values above 100
        if (value > 100) {
            accuracyInput.value = "100";
        }
    });

    // Clamp PP input to minimum of 0
    ppInput.addEventListener("input", () => {
        const value = Number.parseFloat(ppInput.value);

        if (Number.isNaN(value)) {
            return;
        }

        // Prevent negative values
        if (value < 0) {
            ppInput.value = "0";
        }
    });

    // Clamp score input between 0 and 999,999,999
    scoreInput.addEventListener("input", () => {
        const value = Number.parseInt(scoreInput.value, 10);

        if (Number.isNaN(value)) {
            return;
        }

        // Prevent negative values
        if (value < 0) {
            scoreInput.value = "0";
        }

        // Prevent values above maximum
        if (value > 999_999_999) {
            scoreInput.value = "999999999";
        }
    });

    // Clamp numeric inputs to minimum of 0
    [
        dom.count300(),
        dom.count100(),
        dom.count50(),
        dom.countMiss(),
        dom.countSliderEnds(),
        dom.comboOverride(),
        dom.leaderboardOverride(),
        dom.userRankOverride(),
    ].forEach((input) => {
        input.addEventListener("input", () => {
            const value = Number.parseInt(input.value, 10);

            if (Number.isNaN(value)) {
                return;
            }

            // Prevent negative values
            if (value < 0) {
                input.value = "0";
            }
        });
    });

    // Truncate username input to maximum 15 characters
    usernameInput.addEventListener("input", () => {
        if (usernameInput.value.length > 15) {
            usernameInput.value = usernameInput.value.substring(0, 15);
        }
    });

    // Validate avatar URL format on blur
    avatarInput.addEventListener("blur", () => {
        const value = avatarInput.value.trim();

        // Check if it's a valid image URL
        if (
            value !== "" &&
            !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(value)
        ) {
            setInvalidState(avatarInput);
        } else {
            setValidState(avatarInput);
        }
    });
}