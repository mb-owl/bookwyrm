import { Platform, NativeModules } from "react-native";

// Try to import Constants from expo-constants, but provide fallback if not available
let Constants;
try {
	Constants = require("expo-constants");
} catch (e) {
	// Provide a minimal fallback if expo-constants is not available
	Constants = { expoConfig: {}, manifest: {} };
	console.warn("expo-constants not available, using fallback");
}

// Try to import NetInfo, but provide fallback if not available
let NetInfo;
try {
	NetInfo = require("@react-native-community/netinfo");
} catch (e) {
	// Provide a minimal fallback if NetInfo is not available
	NetInfo = {
		fetch: async () => ({ details: null }),
	};
	console.warn("@react-native-community/netinfo not available, using fallback");
}

/**
 * Enhanced API Configuration for BookWyrm Mobile
 *
 * This module provides flexible API endpoint configuration to work across:
 * - iOS Simulator (localhost)
 * - Android Emulator (10.0.2.2)
 * - Physical devices on same network (device IP or Expo host IP)
 * - Production environments
 */

// Default API port
const API_PORT = "8000";

// List of potential backend URLs to try
let API_URLS = [];

// Flag to track if initialization is complete
let isInitialized = false;

// Track which URL works for faster future lookups
let workingApiUrl = null;

// Get the local IP address from the dev server if available
const getDevServerIp = () => {
	if (__DEV__) {
		try {
			// First try Expo's hostUri which is most reliable
			const hostUri =
				Constants.expoConfig?.hostUri ||
				Constants.manifest?.hostUri ||
				Constants.manifest?.debuggerHost;

			if (hostUri) {
				const host = hostUri.split(":")[0];
				if (host && host !== "localhost") {
					return host;
				}
			}

			// Second, try to extract IP from native modules (works in some environments)
			if (Platform.OS === "android") {
				const scriptURL = NativeModules.SourceCode?.scriptURL;
				if (scriptURL) {
					const address = scriptURL.split("://")[1]?.split(":")[0];
					if (address && address !== "localhost") {
						return address;
					}
				}
			}
		} catch (error) {
			console.warn("Error getting dev server IP:", error);
		}
	}
	return null;
};

// Get the device's own IP address (useful for finding server on same network)
const getCommonLocalIpPrefixes = () => {
	// Common local network IP prefixes
	return [
		"192.168.",
		"10.0.",
		"172.16.",
		"172.17.",
		"172.18.",
		"172.19.",
		"172.20.",
		"172.21.",
		"172.22.",
	];
};

// Initialize the API URLs
const initializeApiUrls = async () => {
	if (isInitialized && workingApiUrl) return;

	const urls = [];

	// Get dev server IP if available
	const devServerIp = getDevServerIp();

	// Get network state for additional info - with error handling
	let networkState = { details: null };
	try {
		networkState = await NetInfo.fetch();
	} catch (error) {
		console.warn("Error fetching network info:", error);
	}

	if (__DEV__) {
		// FOR SIMULATORS

		// iOS Simulator - localhost works directly
		if (Platform.OS === "ios") {
			urls.push(`http://localhost:${API_PORT}/api`);
		}

		// Android Emulator - special IP for localhost
		if (Platform.OS === "android") {
			urls.push(`http://10.0.2.2:${API_PORT}/api`); // Standard Android emulator
			urls.push(`http://10.0.3.2:${API_PORT}/api`); // Genymotion
		}

		// FOR PHYSICAL DEVICES & EXPO

		// If we have a dev server IP, use it first (most reliable)
		if (devServerIp) {
			urls.push(`http://${devServerIp}:${API_PORT}/api`);
		}

		// Add the device's WiFi gateway as a potential server location
		if (networkState.details?.ipAddress && networkState.details?.subnet) {
			try {
				// Extract gateway from IP and subnet if available
				const ipParts = networkState.details.ipAddress.split(".");
				if (ipParts.length === 4) {
					// Try gateway at x.x.x.1
					urls.push(
						`http://${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1:${API_PORT}/api`
					);
				}
			} catch (error) {
				console.warn("Error calculating gateway IP:", error);
			}
		}

		// Common development machine IPs to try as fallbacks
		const localPrefixes = getCommonLocalIpPrefixes();
		localPrefixes.forEach((prefix) => {
			// Try common last octets for development machines
			[1, 100, 101, 102, 103, 104, 105].forEach((lastOctet) => {
				urls.push(`http://${prefix}${lastOctet}:${API_PORT}/api`);
			});
		});

		// Add hardcoded fallbacks for common development scenarios
		urls.push(`http://127.0.0.1:${API_PORT}/api`);
		urls.push(`http://localhost:${API_PORT}/api`);
		
		// User-configurable override (set this manually if needed)
		urls.push("http://YOUR_COMPUTER_IP:8000/api");
	} else {
		// Production URL for non-dev builds
		urls.push("https://bookwyrm-production.example.com/api");
	}

	// Deduplicate URLs
	API_URLS = [...new Set(urls)];
	isInitialized = true;

	console.log("Potential API URLs:", API_URLS);
};

// Initialize on module load - but handle errors gracefully
try {
	initializeApiUrls().catch((err) =>
		console.warn("Error initializing API URLs:", err)
	);
} catch (error) {
	console.error("Critical error during API URL initialization:", error);
}

/**
 * Get a properly formatted API endpoint
 * @param {string} path - The API path to request
 * @returns {string} The full API URL
 */
export const getApiEndpoint = (path) => {
	try {
		// Use the known working URL if available, otherwise use the first URL
		// Safely handle the case where API_URLS might be empty
		const baseUrl = workingApiUrl || (API_URLS.length > 0 ? API_URLS[0] : "http://localhost:8000/api");

		// Guard against undefined/null baseUrl
		if (!baseUrl) return `http://localhost:8000/api/${path || ""}`;

		// Ensure base URL ends with slash
		const formattedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

		// Guard against undefined/null path
		if (!path) return formattedBaseUrl;

		// Remove leading slash from path if present
		const cleanPath = path.startsWith("/") ? path.substring(1) : path;

		// Ensure path ends with slash for Django
		const formattedPath = cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;

		return `${formattedBaseUrl}${formattedPath}`;
	} catch (error) {
		// Safely handle any unexpected errors and provide a fallback
		console.error("Error in getApiEndpoint:", error);
		return `http://localhost:8000/api/${path || ""}`;
	}
};

/**
 * Get the URL for media files
 * @returns {string} The media URL
 */
export const getMediaUrl = () => {
	try {
		// Use the known working URL base or first available
		// Safely handle the case where API_URLS might be empty
		const baseUrl = workingApiUrl || (API_URLS.length > 0 ? API_URLS[0] : "http://localhost:8000/api");
		
		// Guard against undefined/null baseUrl
		if (!baseUrl) return "http://localhost:8000/media/";

		// Get the base URL without 'api/'
		// Fix the error: Cannot read property 'replace' of undefined
		const baseUrlWithoutApi = baseUrl.toString().replace(/\/api\/?$/, "");
		return `${baseUrlWithoutApi}/media/`;
	} catch (error) {
		// Safely handle any unexpected errors and provide a fallback
		console.error("Error in getMediaUrl:", error);
		return "http://localhost:8000/media/";
	}
};

/**
 * Get the URL for book photos
 * @returns {string} The book photos URL
 */
export const getBookPhotosUrl = () => {
	try {
		return `${getMediaUrl()}book_photos/`;
	} catch (error) {
		// Safely handle any unexpected errors and provide a fallback
		console.error("Error in getBookPhotosUrl:", error);
		return "http://localhost:8000/media/book_photos/";
	}
};

/**
 * Configure fetch options for API requests
 * @param {Object} options - Additional fetch options
 * @returns {Object} Configured fetch options
 */
export const getApiRequestOptions = (options = {}) => {
	return {
		// Default options
		headers: {
			Accept: "application/json",
			...(options.headers || {}),
		},
		// 10 second timeout for all requests
		timeout: 10000,
		...options,
	};
};

/**
 * Try to find a working API URL by testing each potential URL
 * @returns {Promise<string|null>} The first working URL or null if none work
 */
export const findWorkingApiUrl = async () => {
	if (workingApiUrl) return workingApiUrl;

	// Ensure we have URLs initialized
	await initializeApiUrls();

	// Add a very small delay to avoid network contention on app start
	await new Promise((resolve) => setTimeout(resolve, 100));

	console.log("Testing API URLs for connectivity...");

	for (const url of API_URLS) {
		try {
			// Skip placeholder URL
			if (url.includes("YOUR_COMPUTER_IP")) continue;

			console.log(`Testing API URL: ${url}`);

			// Set a timeout for the fetch
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000);

			const testUrl = url.endsWith("/") ? `${url}books/` : `${url}/books/`;
			const response = await fetch(testUrl, {
				method: "GET",
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			console.log(`Response from ${url}:`, response.status);
			if (response.ok) {
				// If we get a successful response, set this as the working URL
				workingApiUrl = url;
				console.log(`Working API URL found: ${workingApiUrl}`);
				return workingApiUrl;
			} else {
				console.warn(`API URL ${url} returned error: ${response.status}`);
			}
		}	 catch (error) {
			// Handle fetch errors gracefully
			if (error.name === "AbortError") {
				console.warn(`Fetch to ${url} timed out`);
			} else {
				console.error(`Error testing API URL ${url}:`, error);
			}
		}
	}
	// If no working URL is found, return null
	console.warn("No working API URL found");
	return null;
}