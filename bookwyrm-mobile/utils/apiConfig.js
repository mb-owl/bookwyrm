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
      const hostIp = Constants.expoConfig.hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost') {
        console.log("Using Expo host IP:", hostIp);
        return hostIp;
      }
    }
    
    // For older Expo SDKs
    if (Constants.manifest?.debuggerHost) {
      const hostIp = Constants.manifest.debuggerHost.split(':')[0];
      if (hostIp && hostIp !== 'localhost') {
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
  if (expoHostIp) return expoHostIp;
  
  // 2. For iOS simulator: Use localhost
  if (Platform.OS === 'ios' && !Platform.isDevice) {
    console.log("Using localhost for iOS simulator");
    return "localhost";
  }
  
  // 3. For Android emulator: Use 10.0.2.2 (special Android emulator address for host machine)
  if (Platform.OS === 'android' && !Platform.isDevice) {
    console.log("Using 10.0.2.2 for Android emulator");
    return "10.0.2.2";
  }
  
  // 4. For physical devices on same network, use computer's network IP
  // You need to set your computer's IP here for physical device testing
  // Get this from System Preferences > Network or by running 'ipconfig' on Windows
  // or 'ifconfig' on macOS/Linux
  const COMPUTER_NETWORK_IP = "192.168.0.57"; // ← REPLACE WITH YOUR COMPUTER'S IP
  if (Platform.isDevice) {
    console.log("Using computer's network IP for physical device:", COMPUTER_NETWORK_IP);
    return COMPUTER_NETWORK_IP;
  }
  
  // 5. Default fallback
  console.log("Using default 127.0.0.1 as fallback");
  return "127.0.0.1";
};

// Initialize API_HOST and BASE_API_URL
let API_HOST = "127.0.0.1:8000/api/books"; // Default, will be updated
let BASE_API_URL = `http://${API_HOST}:${API_PORT}/api`;
let API_STATUS_ENDPOINT = `http://${API_HOST}:${API_PORT}/api/status/`;

// Define potential API URLs to try in order of preference
let API_URLS = [];

// Init function that will be called immediately and on first API call
const initApiConfig = async () => {
  try {
    // Get the host IP
    API_HOST = await determineApiHost();
    
    // Update base URLs
    BASE_API_URL = `http://${API_HOST}:${API_PORT}/api`;
    API_STATUS_ENDPOINT = `http://${API_HOST}:${API_PORT}/api/status/`;
    
    // Generate a list of URLs to try in order of preference
    API_URLS = [
      // Current host determined by the app
      `http://${API_HOST}:${API_PORT}/api`,
      
      // iOS simulator specific
      "http://localhost:8000/api",
      
      // Android emulator specific
      "http://10.0.2.2:8000/api",
      
      // Common local development
      "http://127.0.0.1:8000/api",
    ];
    
    // Log the configuration
    console.log("API Host:", API_HOST);
    console.log("Base API URL:", BASE_API_URL);
    console.log("Available API URLs:", API_URLS);
    
    // Return true on success
    return true;
  } catch (e) {
    console.error("Error initializing API config:", e);
    return false;
  }
};

// Run initialization immediately
initApiConfig().catch(err => {
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
      console.log(`Testing URL: ${url}/status/`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout
      
      const response = await fetch(`${url}/status/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ URL working: ${url}`);
        
        // Update the global variables
        BASE_API_URL = url;
        API_HOST = url.split("://")[1].split(":")[0];
        API_STATUS_ENDPOINT = `${url}/status/`;
        
        return url;
      }
    } catch (error) {
      console.log(`❌ URL failed: ${url}`);
    }
  }
  
  console.log("No working URLs found");
  return null;
}; 