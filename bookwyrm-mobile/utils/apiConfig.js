import { Platform } from "react-native";

// Define configurations for development and production environments
const DEV_CONFIG = {
	// For iOS simulator
	ios: {
		apiUrl: "http://localhost:8000/api",
		mediaUrl: "http://localhost:8000/api/books/media/book_photos/", // Updated direct path
	},
	// For Android emulator
	android: {
		apiUrl: "http://10.0.2.2:8000/api",
		mediaUrl: "http://10.0.2.2:8000/api/books/media/book_photos/", // Updated direct path
	},
};

// Choose the right config based on platform
const config = DEV_CONFIG[Platform.OS] || DEV_CONFIG.ios;

// Export with trailing slashes ensured
const API_BASE_URL = config.apiUrl.endsWith("/")
	? config.apiUrl
	: `${config.apiUrl}/`;

// Helper function to get media URL with proper trailing slash
const getMediaUrl = () => {
	// Ensure trailing slash for the direct book photos URL
	const baseMediaUrl = config.mediaUrl.endsWith("/")
		? config.mediaUrl
		: `${config.mediaUrl}/`;

	return baseMediaUrl;
};

// Book photos URL now directly points to the correct path
const getBookPhotosUrl = () => getMediaUrl();

// ADDED: Helper function to ensure proper URL formation for API endpoints
const getApiEndpoint = (path) => {
	// Start with the base URL
	let url = API_BASE_URL;

	// Remove leading slash from path if present
	const cleanPath = path.startsWith("/") ? path.substring(1) : path;

	// Combine and ensure trailing slash
	url = `${url}${cleanPath}`;
	if (!url.endsWith("/")) {
		url = `${url}/`;
	}

	return url;
};

// Debug information
console.log(`API configured for ${Platform.OS}`);
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Media URL Base: ${getMediaUrl()}`);
console.log(`Book Photos URL: ${getBookPhotosUrl()}`);

// Export the configuration
export { API_BASE_URL, getMediaUrl, getBookPhotosUrl, getApiEndpoint };
