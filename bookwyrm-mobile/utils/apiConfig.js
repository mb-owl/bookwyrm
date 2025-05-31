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
 * Enhanced API Configuration for BookWyrm Mobile
 *
 * Supports devices on the same Wi-Fi network accessing the development server
 */

// API Configuration
const API_PORT = "8000";

// Get the host IP from Expo Constants if available (works with Expo Go)
const getExpoHostIp = () => {
	try {
		// For Expo SDK 44+
		if (Constants.expoConfig?.hostUri) {
			const hostIp = Constants.expoConfig.hostUri.split(":")[0];
			if (hostIp && hostIp !== "localhost") {
				console.log("Using Expo host IP:", hostIp);
				return hostIp;
			}
		}

		// For older Expo SDKs
		if (Constants.manifest?.debuggerHost) {
			const hostIp = Constants.manifest.debuggerHost.split(":")[0];
			if (hostIp && hostIp !== "localhost") {
				console.log("Using Expo debugger host IP:", hostIp);
				return hostIp;
			}
		}
	} catch (e) {
		console.warn("Error getting Expo host IP:", e);
	}

	return null;
};

// Get device IP from NetInfo
const getDeviceIp = async () => {
	try {
		const networkInfo = await NetInfo.fetch();
		return networkInfo?.details?.ipAddress;
	} catch (e) {
		console.warn("Error getting device IP:", e);
		return null;
	}
};

// Primary function to get host and build URLs
const determineApiHost = async () => {
	// 1. Priority 1: Use IP from Expo configuration if available
	const expoHostIp = getExpoHostIp();
	if (expoHostIp) {
		console.log("Using Expo host IP:", expoHostIp);
		return expoHostIp;
	}

	// 2. For iOS simulator: Use localhost
	if (Platform.OS === "ios" && !Platform.isDevice) {
		console.log("Using localhost for iOS simulator");
		return "localhost";
	}

	// 3. For Android emulator: Use 10.0.2.2 (special Android emulator address for host machine)
	if (Platform.OS === "android" && !Platform.isDevice) {
		console.log("Using 10.0.2.2 for Android emulator");
		return "10.0.2.2";
	}

	// 4. For physical devices on same network, use a list of potential IPs
	// Add all your network interface IPs here
	const POTENTIAL_NETWORK_IPS = [
		"192.168.0.57", // Your primary WiFi
		"10.0.0.1", // Alternative network
		"172.20.10.1", // Hotspot
		"0.0.0.0", // Allow any IP (when running Django with 0.0.0.0 binding)
	];

	if (Platform.isDevice) {
		console.log("Using multiple potential IPs for physical device");
		// We'll still return the first one, but we'll try all of them in findWorkingApiUrl
		return POTENTIAL_NETWORK_IPS[0];
	}

	// 5. Default fallback
	console.log("Using default 127.0.0.1 as fallback");
	return "127.0.0.1";
};

// Initialize API_HOST and BASE_API_URL
let API_HOST = "127.0.0.1"; // Fixed: removed incorrect path from host
let BASE_API_URL = `http://${API_HOST}:${API_PORT}/api`;
let API_BOOKS_ENDPOINT = `http://${API_HOST}:${API_PORT}/api/books/`;
let POTENTIAL_NETWORK_IPS = [];

// Define potential API URLs to try in order of preference
let API_URLS = [];

// Init function that will be called immediately and on first API call
const initApiConfig = async () => {
	try {
		// Get the host IP
		API_HOST = await determineApiHost();

		// Update base URLs
		BASE_API_URL = `http://${API_HOST}:${API_PORT}/api`;
		API_BOOKS_ENDPOINT = `http://${API_HOST}:${API_PORT}/api/books/`;

		// Define all potential network IPs to try - crucial for unrestricted access
		POTENTIAL_NETWORK_IPS = [
			"192.168.0.57", // Your primary WiFi
			"10.0.0.1", // Alternative network
			"172.20.10.1", // Hotspot
			"0.0.0.0", // Allow any IP
			"localhost", // For simulators
			"127.0.0.1", // Local loopback
			"10.0.2.2", // Android emulator
		];

		// Add the Expo IP if available
		const expoIp = getExpoHostIp();
		if (expoIp && !POTENTIAL_NETWORK_IPS.includes(expoIp)) {
			POTENTIAL_NETWORK_IPS.unshift(expoIp);
		}

		// Generate a list of URLs to try in order of preference
		API_URLS = [
			// Current host determined by the app
			`http://${API_HOST}:${API_PORT}/api`,
		];

		// Add URLs for all potential IPs
		POTENTIAL_NETWORK_IPS.forEach((ip) => {
			const url = `http://${ip}:${API_PORT}/api`;
			if (!API_URLS.includes(url)) {
				API_URLS.push(url);
			}
		});

		// Also add these standard URLs
		const standardUrls = [
			"http://localhost:8000/api",
			"http://10.0.2.2:8000/api",
			"http://127.0.0.1:8000/api",
		];

		standardUrls.forEach((url) => {
			if (!API_URLS.includes(url)) {
				API_URLS.push(url);
			}
		});

		// Log the configuration
		console.log("API Host:", API_HOST);
		console.log("Base API URL:", BASE_API_URL);
		console.log("Available API URLs to try:", API_URLS);

		// Return true on success
		return true;
	} catch (e) {
		console.error("Error initializing API config:", e);
		return false;
	}
};

// Run initialization immediately
initApiConfig().catch((err) => {
	console.error("Failed to initialize API config:", err);
});

/**
 * Get a properly formatted API endpoint
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
 * Get the URL for media files
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
 * Get the URL for book photos
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
 * Sets proper headers for cross-device communication
 */
export const getApiRequestOptions = (options = {}) => ({
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
		// Add any other headers needed for your API
		...(options.headers || {}),
	},
	timeout: 10000,
	...options,
});

/**
 * Try all possible API URLs and find one that works
 * @returns {Promise<string|null>} The first working URL or null
 */
export const findWorkingApiUrl = async () => {
	console.log("Testing API URLs to find one that works...");

	// Initialize if not already done
	if (API_URLS.length === 0) {
		await initApiConfig();
	}

	// Try each URL and return the first one that works
	for (const url of API_URLS) {
		try {
			const testUrl = `${url}/books/`;
			console.log(`Testing URL: ${testUrl}`);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

			const response = await fetch(testUrl, {
				method: "GET",
				headers: {
					Accept: "application/json",
					"Cache-Control": "no-cache",
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				console.log(`✅ URL working: ${url}`);

				// Update the global variables
				BASE_API_URL = url;
				API_HOST = url.split("://")[1].split(":")[0];
				API_BOOKS_ENDPOINT = `${url}/books/`;

				return url;
			}
		} catch (error) {
			console.log(`❌ URL failed: ${url}`, error.message ? error.message : "");
		}
	}

	console.log("No working URLs found. Here's how to fix this:");
	console.log(
		"1. Make sure your Django server is running with: python manage.py runserver 0.0.0.0:8000"
	);
	console.log("2. Ensure your phone and computer are on the same WiFi network");
	console.log(
		"3. Check if your computer's firewall is blocking connections on port 8000"
	);
	console.log("4. Try using the Expo tunnel feature: npx expo start --tunnel");
	return null;
};

// Add test connection function
export const testApiConnection = async () => {
	const workingUrl = await findWorkingApiUrl();
	if (workingUrl) {
		console.log(`Connection test successful: ${workingUrl}`);
		return workingUrl;
	}
	console.log("Could not connect to any API endpoint");
	return null;
};
