import { API_BASE_URL } from "./apiConfig";

/**
 * Synchronizes the local genre choices with the backend database
 * @param {Array} genreChoices - Array of genre objects with value and label
 * @returns {Promise} - Promise that resolves when sync is complete
 */
export const syncGenresWithBackend = async (genreChoices) => {
	try {
		console.log("Syncing genres with backend...");

		const response = await fetch(`${API_BASE_URL}/genres/sync/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(genreChoices),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Genre sync failed: ${response.status} ${errorText}`);
		}

		const results = await response.json();
		console.log(`Genre sync complete: ${results.length} genres processed`);
		return results;
	} catch (error) {
		console.error("Error syncing genres:", error);
		// Don't throw - we want the app to continue even if sync fails
		return null;
	}
};

/**
 * Fetches all genres from the backend
 * @returns {Promise<Array>} - Promise that resolves to array of genre objects
 */
export const fetchGenresFromBackend = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/genres/`);

		if (!response.ok) {
			throw new Error(`Failed to fetch genres: ${response.status}`);
		}

		const genres = await response.json();
		return genres.map((genre) => ({
			value: genre.code,
			label: genre.name,
		}));
	} catch (error) {
		console.error("Error fetching genres:", error);
		return null;
	}
};
