import { API_BASE_URL } from "./apiConfig";

/**
 * Synchronizes the local genre choices with the backend database
 * @param {Array} genreChoices - Array of genre objects with value and label
 * @returns {Promise} - Promise that resolves when sync is complete
 */
export const syncGenresWithBackend = async (genreChoices) => {
	try {
		console.log("Syncing genres with backend...");

		// Create data structure to send to backend
		const genresData = genreChoices.map((genre) => ({
			code: genre.value,
			name: genre.label,
		}));

		// Use standard API endpoint for genres
		const response = await fetch(`${API_BASE_URL}/genres/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(genresData),
		});

		// Basic error handling
		if (!response.ok) {
			// Non-critical failure - just log it
			console.warn(`Genre sync failed: ${response.status}`);
			return null;
		}

		const results = await response.json();
		console.log(`Genre sync complete: ${results.length} genres processed`);
		return results;
	} catch (error) {
		// Non-critical error - log but don't throw to prevent app crashes
		console.error("Error syncing genres:", error);
		return null;
	}
};

/**
 * Fetches all genres from the backend
 * @returns {Promise<Array>} - Promise that resolves to array of genre objects
 */
export const fetchGenresFromBackend = async () => {
	try {
		// Same standard API endpoint for genres
		const response = await fetch(`${API_BASE_URL}/genres/`);

		if (!response.ok) {
			console.warn(`Failed to fetch genres: ${response.status}`);
			return null;
		}

		const genres = await response.json();

		// Convert to format expected by the UI (value/label pairs)
		return genres.map((genre) => ({
			value: genre.code,
			label: genre.name,
		}));
	} catch (error) {
		console.error("Error fetching genres:", error);
		return null;
	}
};
