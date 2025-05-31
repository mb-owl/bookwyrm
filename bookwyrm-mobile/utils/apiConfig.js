import { Platform } from "react-native";

// Simplified fallbacks for optional dependencies
let Constants;
try {
	Constants = require("expo-constants");
} catch (e) {
	Constants = { expoConfig: {}, manifest: {} };
	console.warn("expo-constants not available, using fallback");
}

let NetInfo;
try {
	NetInfo = require("@react-native-community/netinfo");
} catch (e) {
	NetInfo = { fetch: async () => ({ details: null }) };
	console.warn("@react-native-community/netinfo not available, using fallback");
}

/**
 * Simplified API Configuration for BookWyrm Mobile
 *
 * Ensures all connections go through 127.0.0.1:8000
 */

// API Configuration
const API_PORT = "8000";
const API_HOST = "127.0.0.1";
const BASE_API_URL = `http://${API_HOST}:${API_PORT}/api`;
const API_STATUS_ENDPOINT = `http://${API_HOST}:${API_PORT}/api/status/`;

// Environment detection
const isIosSimulator = Platform.OS === "ios" && !Platform.isDevice;
const isAndroidEmulator = Platform.OS === "android" && !Platform.isDevice;

// Log environment info (minimal)
console.log(
	`API Config: ${BASE_API_URL} (${Platform.OS} ${
		isIosSimulator
			? "iOS simulator"
			: isAndroidEmulator
			? "Android emulator"
			: "device"
	})`
);

/**
 * Get properly formatted API endpoint
 * @param {string} path - API path to request
 * @returns {string} Full API URL
 */
export const getApiEndpoint = (path) => {
	try {
		// Ensure proper URL formatting
		const formattedBaseUrl = BASE_API_URL.endsWith("/")
			? BASE_API_URL
			: `${BASE_API_URL}/`;
		if (!path) return formattedBaseUrl;

		const cleanPath = path.startsWith("/") ? path.substring(1) : path;
		const formattedPath = cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;

		return `${formattedBaseUrl}${formattedPath}`;
	} catch (error) {
		console.error("Error in getApiEndpoint:", error);
		return `${BASE_API_URL}/${path || ""}`;
	}
};

/**
 * Get URL for media files
 * @returns {string} The media URL
 */
export const getMediaUrl = () => {
	try {
		return `http://${API_HOST}:${API_PORT}/media/`;
	} catch (error) {
		console.error("Error in getMediaUrl:", error);
		return `http://${API_HOST}:${API_PORT}/media/`;
	}
};

/**
 * Get URL for book photos
 * @returns {string} The book photos URL
 */
export const getBookPhotosUrl = () => {
	try {
		return `${getMediaUrl()}book_photos/`;
	} catch (error) {
		console.error("Error in getBookPhotosUrl:", error);
		return `http://${API_HOST}:${API_PORT}/media/book_photos/`;
	}
};

/**
 * Configure fetch options for API requests
 */
export const getApiRequestOptions = (options = {}) => ({
	headers: {
		Accept: "application/json",
		...(options.headers || {}),
	},
	timeout: 10000,
	...options,
});

/**
 * Test API connection
 * @returns {Promise<boolean>} Whether connection was successful
 */
export const testApiConnection = async () => {
	try {
		console.log(`Testing API connection to: ${API_STATUS_ENDPOINT}`);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(API_STATUS_ENDPOINT, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			console.log("✅ API connection successful");
			return true;
		}

		// Fallback to books endpoint
		const booksEndpoint = getApiEndpoint("books");
		console.log(`Trying books endpoint: ${booksEndpoint}`);

		const controller2 = new AbortController();
		const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

		const booksResponse = await fetch(booksEndpoint, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: controller2.signal,
		});

		clearTimeout(timeoutId2);
		return booksResponse.ok;
	} catch (error) {
		console.error("API connection error:", error);
		return false;
	}
};

/**
 * Get debug information about API connection
 */
export const debugApiConnection = async () => {
	// Get network information
	let networkInfo = null;
	try {
		networkInfo = await NetInfo.fetch();
	} catch (e) {
		console.log("Error fetching network info:", e.message);
	}

	// Test connection
	const isConnected = await testApiConnection();

	// Return debug data
	return {
		platform: Platform.OS,
		isDevice: Platform.isDevice,
		isIosSimulator,
		isAndroidEmulator,
		baseApiUrl: BASE_API_URL,
		mediaUrl: getMediaUrl(),
		networkInfo,
		connected: isConnected,
		workingApiUrl: isConnected ? BASE_API_URL : null,
		timestamp: new Date().toISOString(),
	};
};

// Run an initial connection test
testApiConnection()
	.then((result) =>
		console.log(`Initial connection test: ${result ? "SUCCESS" : "FAILED"}`)
	)
	.catch((err) => console.warn("Error in initial connection test:", err));

// Export constants for use in other files
export { BASE_API_URL as API_BASE_URL, API_STATUS_ENDPOINT };

// Default export for backward compatibility
export default BASE_API_URL;
