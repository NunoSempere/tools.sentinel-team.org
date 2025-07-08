// Forecasting functions copied from node_modules to avoid import issues

// Aggregation helpers
const sum = (array) => array.reduce((a, b) => a + b, 0);
const probabilityToOdds = (p) => p / (1 - p);
const oddsToProbability = (o) => o / (1 + o);
const validateArray = (arr) =>
	Array.isArray(arr) &&
	arr.length > 0 &&
	arr.reduce((a, b) => a && typeof b == "number" && b >= 0 && b <= 1, true);

// Aggregation functionsconst median = (array) => {
  if (!validateArray(array)) return -1;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const arithmeticMean = (array) => {
	if (!validateArray(array)) return -1;
	let result = sum(array) / array.length;
	return result;
};

const geometricMean = (array) => {
	if (!validateArray(array)) return -1;
	let arrayAsLog = array.map((p) => Math.log(p));
	let sumOfLogs = sum(arrayAsLog) / arrayAsLog.length;
	let result = Math.exp(sumOfLogs);
	return result;
};

const geometricMeanOfOdds = (array) => {
	if (!validateArray(array)) return -1;
	let arrayOfOdds = array.map((p) => probabilityToOdds(p));
	let arrayOfLogsOfOdds = arrayOfOdds.map((p) => Math.log(p));
	let sumOfLogsOfOdds = sum(arrayOfLogsOfOdds) / arrayOfLogsOfOdds.length;
	let geomMeanOfOdds = Math.exp(sumOfLogsOfOdds);
	let result = oddsToProbability(geomMeanOfOdds);
	return result;
};

const extremizedGeometricMeanOfOdds = (array, extremizationParameter = 1.5) => {
	if (!validateArray(array)) return -1;
	let arrayOfOdds = array.map((p) => probabilityToOdds(p));
	let arrayOfLogsOfOdds = arrayOfOdds.map((p) => Math.log(p));
	let extremizedSumOfLogsOfOdds =
		(extremizationParameter * sum(arrayOfLogsOfOdds)) /
		arrayOfLogsOfOdds.length;
	let extremizedGeomMeanOfOdds = Math.exp(extremizedSumOfLogsOfOdds);
	let result = oddsToProbability(extremizedGeomMeanOfOdds);
	return result;
};

const neyman = (array) => {
	if (!validateArray(array)) return -1;
	let n = array.length;
	let d =
		(n * (Math.sqrt(3 * Math.pow(n, 2) - 3 * n + 1) - 2)) /
		(Math.pow(n, 2) - n - 1);
	let result = extremizedGeometricMeanOfOdds(array, d);
	return result;
};

// Laplace helpers
const validateNumAboveZero = (n) => typeof n == "number" && n >= 0;

// Laplace function
const laplace = (num_past_successes, num_past_trials, num_future_trials) => {
	if (
		!(
			validateNumAboveZero(num_past_successes) &&
			validateNumAboveZero(num_past_trials) &&
			validateNumAboveZero(num_future_trials)
		)
	) {
		return -1;
	}

	let p = 0.0;
	let s = num_past_successes;
	let t = num_past_trials;
	for (let i = 0; i < num_future_trials; i++) {
		p = p + ((1 - p) * (s + 1)) / (t + 2);
		t++;
	}
	return p;
};

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
		.split(",")
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
		{ name: "Median", value: median(probabilities) },
		{ name: "Arithmetic Mean", value: arithmeticMean(probabilities) },
		{ name: "Geometric Mean", value: geometricMean(probabilities) },
		{
			name: "Geometric Mean of Odds",
			value: geometricMeanOfOdds(probabilities),
		},
		{
			name: "Extremized Geometric Mean of Odds",
			value: extremizedGeometricMeanOfOdds(probabilities),
		},
		{ name: "Neyman", value: neyman(probabilities) },
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
