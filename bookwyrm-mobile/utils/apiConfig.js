import { Platform } from "react-native";

// Define a simple configuration for the API URL
// Using a fixed localhost URL (127.0.0.1) for both simulator and device
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Helper function to get media URL
const getMediaUrl = () => {
	return "http://127.0.0.1:8000/media/";
};

// Export the configuration
export { API_BASE_URL, getMediaUrl };
