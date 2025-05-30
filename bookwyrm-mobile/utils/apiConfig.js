import { Platform } from "react-native";

// Define a simple configuration for the API URL
// Updated to work with both simulator and physical device
const API_BASE_URL =
	Platform.OS === "ios"
		? "http://localhost:8000/api"
		: "http://10.0.2.2:8000/api"; // Android emulator uses 10.0.2.2 to access host

// Helper function to get media URL
const getMediaUrl = () => {
	return Platform.OS === "ios"
		? "http://localhost:8000/media/"
		: "http://10.0.2.2:8000/media/";
};

// Export the configuration
export { API_BASE_URL, getMediaUrl };
