import * as aggregation from "./deps/aggregation.js";
import { laplace } from "./deps/laplace.js";

// DOM elements
const probabilitiesInput = document.getElementById("probabilities-input");
const calculateAggregationBtn = document.getElementById(
	"calculate-aggregation",
);
const aggregationResultsDiv = document.getElementById("aggregation-results");

const pastSuccessesInput = document.getElementById("past-successes");
const pastTrialsInput = document.getElementById("past-trials");
const futureTrialsInput = document.getElementById("future-trials");
const calculateLaplaceBtn = document.getElementById("calculate-laplace");
const laplaceResultDiv = document.getElementById("laplace-result");

// Aggregation Tools Handler
calculateAggregationBtn.addEventListener("click", () => {
	const inputText = probabilitiesInput.value.trim();

	if (!inputText) {
		showError(aggregationResultsDiv, "Please enter some probabilities.");
		return;
	}

	// Parse probabilities
	const probabilities = inputText
		.split("\n")
		.map((p) => parseFloat(p.trim()))
		.filter((p) => !isNaN(p));

	// Validate probabilities
	const invalidProbs = probabilities.filter((p) => p < 0 || p > 1);
	if (invalidProbs.length > 0) {
		showError(
			aggregationResultsDiv,
			"All probabilities must be between 0 and 1.",
		);
		return;
	}

	if (probabilities.length === 0) {
		showError(
			aggregationResultsDiv,
			"Please enter valid, comma-separated probabilities.",
		);
		return;
	}

	// Calculate all aggregation methods
	const results = [
		{ name: "Median", value: aggregation.median(probabilities) },
		{
			name: "Arithmetic Mean",
			value: aggregation.arithmeticMean(probabilities),
		},
		{ name: "Geometric Mean", value: aggregation.geometricMean(probabilities) },
		{
			name: "Geometric Mean of Odds",
			value: aggregation.geometricMeanOfOdds(probabilities),
		},
		{
			name: "Extremized Geometric Mean of Odds",
			value: aggregation.extremizedGeometricMeanOfOdds(probabilities),
		},
		{ name: "Neyman", value: aggregation.neyman(probabilities) },
	];

	// Display results
	let resultsHTML = '<h3>Aggregation Results</h3><ul class="results-list">';
	results.forEach((result) => {
		const value = result.value === -1 ? "Error" : result.value.toFixed(4);
		resultsHTML += `
            <li>
                <span class="method-name">${result.name}:</span>
                <span class="method-value">${value}</span>
            </li>
        `;
	});
	resultsHTML += "</ul>";

	showResults(aggregationResultsDiv, resultsHTML);
});

// Laplace's Rule Handler
calculateLaplaceBtn.addEventListener("click", () => {
	const successes = parseInt(pastSuccessesInput.value);
	const trials = parseInt(pastTrialsInput.value);
	const futureTrials = parseInt(futureTrialsInput.value);

	// Validation
	if (isNaN(successes) || isNaN(trials) || isNaN(futureTrials)) {
		showError(laplaceResultDiv, "Please enter valid numbers for all fields.");
		return;
	}

	if (successes < 0 || trials < 0 || futureTrials < 0) {
		showError(laplaceResultDiv, "All values must be non-negative.");
		return;
	}

	if (successes > trials) {
		showError(laplaceResultDiv, "Past successes cannot exceed past trials.");
		return;
	}

	// Calculate result
	const result = laplace(successes, trials, futureTrials);

	if (result === -1) {
		showError(
			laplaceResultDiv,
			"Error in calculation. Please check your inputs.",
		);
		return;
	}

	// Display result
	const percentage = (result * 100).toFixed(2);
	const resultsHTML = `
        <h3>Laplace's Rule Result</h3>
        <div class="success">
            <strong>Probability of success in next ${futureTrials} trial(s):</strong><br>
            ${result.toFixed(4)} (${percentage}%)
        </div>
        <p style="margin-top: 15px; color: #718096; font-size: 0.9rem;">
            Based on ${successes} successes out of ${trials} past trials.
        </p>
    `;

	showResults(laplaceResultDiv, resultsHTML);
});

// Helper functions
function showError(container, message) {
	container.innerHTML = `<div class="error">${message}</div>`;
	container.classList.add("show");
}

function showResults(container, html) {
	container.innerHTML = html;
	container.classList.add("show");
}

// Add input validation and formatting
probabilitiesInput.addEventListener("input", (e) => {
	// Auto-format comma-separated values
	let value = e.target.value;
	// Remove any non-numeric characters except commas, dots, and spaces
	value = value.replace(/[^0-9,.\s]/g, "");
	e.target.value = value;
});

// Add Enter key support
probabilitiesInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		calculateAggregationBtn.click();
	}
});

[pastSuccessesInput, pastTrialsInput, futureTrialsInput].forEach((input) => {
	input.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			calculateLaplaceBtn.click();
		}
	});
});
