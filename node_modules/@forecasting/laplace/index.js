// Helpers
const validateNumAboveZero = (n) => typeof n == "number" && n >= 0;

// Main functions
export const laplace = (
	num_past_successes,
	num_past_trials,
	num_future_trials,
) => {
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
