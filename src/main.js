import * as aggregation from "./deps/aggregation.js";
import { laplace } from "./deps/laplace.js";
import { daysUntil, daysSince, getTodayFormatted } from "./deps/dates.js";
import { combineMarkdownFiles } from "./deps/markdown-combiner.js";

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

// Date calculation elements
const targetDateInput = document.getElementById("target-date");
const pastDateInput = document.getElementById("past-date");
const calculateDaysUntilBtn = document.getElementById("calculate-days-until");
const calculateDaysSinceBtn = document.getElementById("calculate-days-since");
const dateResultsDiv = document.getElementById("date-results");

// Beta distribution elements
const ciLowerInput = document.getElementById("ci-lower");
const ciUpperInput = document.getElementById("ci-upper");
const ciLengthInput = document.getElementById("ci-length");
const calculateBetaBtn = document.getElementById("calculate-beta");
const betaResultDiv = document.getElementById("beta-result");

// Google Docs combiner elements
const gdocsUrlsInput = document.getElementById("gdocs-urls");
const combineGdocsBtn = document.getElementById("combine-gdocs");
const gdocsResultDiv = document.getElementById("gdocs-result");

const prettyPrintProbs = (p) => {
	return p === -1 ? "Error" : Math.round(1000 * p) / 10;
};

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
			"Please enter valid probabilities (one per line).",
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
		const value = prettyPrintProbs(result.value);
		resultsHTML += `
            <li>
                <span class="method-name">${result.name}:</span>
                <span class="method-value">${value}%</span>
            </li>
        `;
	});
	const p = aggregation.geometricMeanOfOdds(probabilities);
	const min = Math.min(...probabilities);
	const max = Math.max(...probabilities);
	const s = `${prettyPrintProbs(p)}% (${prettyPrintProbs(min)}% to ${prettyPrintProbs(max)}%)`;
	resultsHTML += `
            <li>
                <span class="method-name">Sentinel-style string:</span>
                <span class="method-value">${s}</span>
            </li>
        `;
	resultsHTML += "</ul>";

	showResults(aggregationResultsDiv, resultsHTML);
});

// Date Calculations Handlers
calculateDaysUntilBtn.addEventListener("click", () => {
	const targetDate = targetDateInput.value.trim();
	
	if (!targetDate) {
		showError(dateResultsDiv, "Please enter a target date.");
		return;
	}
	
	const result = daysUntil(targetDate);
	
	if (result.error) {
		let errorMessage = result.error;
		if (result.suggestion) {
			errorMessage += ` ${result.suggestion}`;
		}
		showError(dateResultsDiv, errorMessage);
		return;
	}
	
	const resultsHTML = `
		<div>
			<span class="method-value">${result.days}</span> days until ${targetDate}; today is ${getTodayFormatted()}
		</div>
	`;
	
	showResults(dateResultsDiv, resultsHTML);
});

calculateDaysSinceBtn.addEventListener("click", () => {
	const pastDate = pastDateInput.value.trim();
	
	if (!pastDate) {
		showError(dateResultsDiv, "Please enter a past date.");
		return;
	}
	
	const result = daysSince(pastDate);
	
	if (result.error) {
		let errorMessage = result.error;
		if (result.suggestion) {
			errorMessage += ` ${result.suggestion}`;
		}
		showError(dateResultsDiv, errorMessage);
		return;
	}
	
	const resultsHTML = `
		<div>
			<span class="method-value">${result.days}</span> days since ${pastDate}; today is ${getTodayFormatted()}
		</div>
	`;
	
	showResults(dateResultsDiv, resultsHTML);
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
        <div>
            <strong>Probability of success in next ${futureTrials} trial(s):</strong><br>
            ${result.toFixed(4)} (${percentage}%)
        </div>
    `;

	showResults(laplaceResultDiv, resultsHTML);
});

// Beta Distribution Handler
calculateBetaBtn.addEventListener("click", () => {
	const ciLower = parseFloat(ciLowerInput.value);
	const ciUpper = parseFloat(ciUpperInput.value);
	const ciLength = parseFloat(ciLengthInput.value);

	// Validation
	if (isNaN(ciLower) || isNaN(ciUpper) || isNaN(ciLength)) {
		showError(betaResultDiv, "Please enter valid numbers for all fields.");
		return;
	}

	if (ciLower < 0 || ciLower > 1 || ciUpper < 0 || ciUpper > 1) {
		showError(
			betaResultDiv,
			"Confidence interval values must be between 0 and 1.",
		);
		return;
	}

	if (ciLength <= 0 || ciLength > 1) {
		showError(
			betaResultDiv,
			"Confidence interval length must be between 0 and 1.",
		);
		return;
	}

	if (ciLower >= ciUpper) {
		showError(betaResultDiv, "Lower bound must be less than upper bound.");
		return;
	}

	// Disable button and show loading state
	calculateBetaBtn.disabled = true;
	calculateBetaBtn.textContent = "Calculating...";

	// Prepare data for API call
	const data = {
		ci_lower: ciLower,
		ci_upper: ciUpper,
		ci_length: ciLength,
	};

	// Make request to external API
	fetch("https://trastos.nunosempere.com/fit-beta", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((result) => {
			// Re-enable button
			calculateBetaBtn.disabled = false;
			calculateBetaBtn.textContent = "Calculate Beta Distribution";

			// Display result
			const resultsHTML = `
			<div>
				<strong>Beta Distribution Parameters:</strong><br>
				<span class="method-value">beta(${result[0]}, ${result[1]})</span>
			</div>
		`;
			showResults(betaResultDiv, resultsHTML);
		})
		.catch((error) => {
			// Re-enable button
			calculateBetaBtn.disabled = false;
			calculateBetaBtn.textContent = "Calculate Beta Distribution";

			console.error("Error:", error);
			showError(
				betaResultDiv,
				"Error calculating beta distribution. Please try again or check your internet connection.",
			);
		});
});

// Google Docs Combiner Handler
combineGdocsBtn.addEventListener("click", async () => {
	const inputText = gdocsUrlsInput.value.trim();

	if (!inputText) {
		showError(gdocsResultDiv, "Please enter Google Docs URLs.");
		return;
	}

	// Extract Google Doc IDs from URLs
	const urls = inputText.split("\n").map(url => url.trim()).filter(url => url);
	const docIds = [];

	for (const url of urls) {
		const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
		if (match) {
			docIds.push(match[1]);
		} else {
			showError(gdocsResultDiv, `Invalid Google Docs URL: ${url}`);
			return;
		}
	}

	if (docIds.length === 0) {
		showError(gdocsResultDiv, "No valid Google Docs URLs found.");
		return;
	}

	// Disable button and show loading state
	combineGdocsBtn.disabled = true;
	combineGdocsBtn.textContent = "Fetching and combining...";

	try {
		// Fetch markdown content for each document
		const markdownContents = [];
		for (const docId of docIds) {
			const response = await fetch(`https://trastos.nunosempere.com/get-gdoc?id=${docId}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch document ${docId}: ${response.status}`);
			}
			const markdown = await response.text();
			markdownContents.push(markdown);
		}

		// Combine the markdown files
		const result = combineMarkdownFiles(markdownContents);

		if (result.error) {
			throw new Error(result.error);
		}

		// Display result
		const resultsHTML = `
			<div>
				<h3>Combined Google Docs</h3>
				<p>${result.message}</p>
				<div class="markdown-output">
					<h4>Combined Markdown:</h4>
					<textarea readonly class="markdown-textarea" cols="60" rows="20">${result.combined}</textarea>
					<br><br>
					<button class="primary-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" >Copy to Clipboard</button>
				</div>
			</div>
		`;

		showResults(gdocsResultDiv, resultsHTML);

	} catch (error) {
		console.error("Error:", error);
		showError(gdocsResultDiv, `Error: ${error.message}`);
	} finally {
		// Re-enable button
		combineGdocsBtn.disabled = false;
		combineGdocsBtn.textContent = "Combine Google Docs";
	}
});

// Google Docs input event listeners
gdocsUrlsInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		e.preventDefault();
		combineGdocsBtn.click();
	}
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
	// Auto-format newline-separated values
	let value = e.target.value;
	// Remove any non-numeric characters except dots, spaces, and newlines
	value = value.replace(/[^0-9.\s\n]/g, "");
	e.target.value = value;
});

// Add Ctrl+Enter or Cmd+Enter to calculate (Enter allows newlines)
probabilitiesInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
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

// Date input event listeners
targetDateInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		calculateDaysUntilBtn.click();
	}
});

pastDateInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		calculateDaysSinceBtn.click();
	}
});

[ciLowerInput, ciUpperInput, ciLengthInput].forEach((input) => {
	input.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			calculateBetaBtn.click();
		}
	});
});
