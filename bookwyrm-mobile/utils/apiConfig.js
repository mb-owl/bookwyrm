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

// DEVICE-SPECIFIC CONFIGURATION
// ===============================
// IMPORTANT: Update these values with your actual device and computer information
const COMPUTER_LOCAL_IP = "192.168.0.57";   // Your computer's IP address on the local network
const BASE_SERVER_URL = "127.0.0.1";        // Your server's base URL (usually localhost)
const IPHONE_IP = "192.168.0.158";          // Your iPhone's IP address

// Device detection helper
const isPhysicalDevice = Platform.OS === "ios" && !global.nativeCallSyncHook;

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
          console.log("Found Expo host IP:", host);
          return host;
        }
      }

      // Second, try to extract IP from native modules (works in some environments)
      if (Platform.OS === "android") {
        const scriptURL = NativeModules.SourceCode?.scriptURL;
        if (scriptURL) {
          const address = scriptURL.split("://")[1]?.split(":")[0];
          if (address && address !== "localhost") {
            console.log("Found Android source IP:", address);
            return address;
          }
        }
      }
      
      // Always return the computer's IP as a reliable fallback in dev mode
      return COMPUTER_LOCAL_IP;
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
  console.log(`Initializing API URLs for ${Platform.OS} (${Platform.isDevice ? 'physical device' : 'simulator'})`);

  // Get dev server IP if available
  const devServerIp = getDevServerIp();
  console.log("Dev server IP:", devServerIp);

  // Get network state for additional info - with error handling
  let networkState = { details: null };
  try {
    networkState = await NetInfo.fetch();
    console.log("Network state IP:", networkState.details?.ipAddress);
  } catch (error) {
    console.warn("Error fetching network info:", error);
  }

  if (__DEV__) {
    // SECTION 1: DEVICE-SPECIFIC PRIORITIES
    // =====================================
    
    // HIGHEST PRIORITY: Your specific devices
    // The most reliable connection is your computer's IP address for physical devices
    urls.push(`http://${COMPUTER_LOCAL_IP}:${API_PORT}/api`);
    console.log(`Added primary computer IP: http://${COMPUTER_LOCAL_IP}:${API_PORT}/api`);
    
    // If we know this is running on your iPhone, prioritize a direct connection
    if (networkState.details?.ipAddress === IPHONE_IP) {
      console.log(`Detected iPhone at ${IPHONE_IP}, optimizing connection`);
      // Prioritize computer's IP for iPhone connection
      urls.unshift(`http://${COMPUTER_LOCAL_IP}:${API_PORT}/api`);
    }

    // SECTION 2: SIMULATOR-SPECIFIC CONFIGURATIONS
    // ============================================
    
    // iOS Simulator - localhost works directly
    if (Platform.OS === "ios" && !Platform.isDevice) {
      urls.push(`http://localhost:${API_PORT}/api`);
      urls.push(`http://127.0.0.1:${API_PORT}/api`);
      console.log("Added iOS simulator URLs");
    }

    // Android Emulator - special IP for localhost
    if (Platform.OS === "android" && !Platform.isDevice) {
      urls.push(`http://10.0.2.2:${API_PORT}/api`); // Standard Android emulator
      urls.push(`http://10.0.3.2:${API_PORT}/api`); // Genymotion
      console.log("Added Android emulator URLs");
    }

    // SECTION 3: EXPO-SPECIFIC CONFIGURATIONS
    // =======================================
    
    // Expo Go app will use the dev server IP
    if (devServerIp && devServerIp !== COMPUTER_LOCAL_IP) {
      urls.push(`http://${devServerIp}:${API_PORT}/api`);
      console.log(`Added Expo dev server URL: ${devServerIp}`);
    }

    // SECTION 4: DYNAMIC DISCOVERY
    // ===========================
    
    // Add the device's WiFi gateway as a potential server location
    if (networkState.details?.ipAddress && networkState.details?.subnet) {
      try {
        // Extract gateway from IP and subnet if available
        const ipParts = networkState.details.ipAddress.split(".");
        if (ipParts.length === 4) {
          // Try gateway at x.x.x.1
          const gatewayIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;
          urls.push(`http://${gatewayIp}:${API_PORT}/api`);
          console.log(`Added network gateway: ${gatewayIp}`);
        }
      } catch (error) {
        console.warn("Error calculating gateway IP:", error);
      }
    }

    // SECTION 5: FALLBACK OPTIONS
    // ==========================
    
    // Common development machine IPs to try as fallbacks
    const localPrefixes = getCommonLocalIpPrefixes();
    localPrefixes.forEach((prefix) => {
      // Only add IPs close to our known computer IP to reduce the number of attempts
      if (COMPUTER_LOCAL_IP.startsWith(prefix)) {
        // Focus on IPs near our computer's IP by checking nearby addresses
        const lastOctet = parseInt(COMPUTER_LOCAL_IP.split('.').pop());
        [-2, -1, 0, 1, 2, 3, 4, 5].forEach(offset => {
          const targetOctet = lastOctet + offset;
          if (targetOctet > 0 && targetOctet < 255) {
            const ip = `${prefix}${targetOctet}`;
            if (ip !== COMPUTER_LOCAL_IP) { // Avoid duplication
              urls.push(`http://${ip}:${API_PORT}/api`);
            }
          }
        });
      }
    });

    // Standard fallbacks that should work in most environments
    urls.push(`http://127.0.0.1:${API_PORT}/api`);
    urls.push(`http://localhost:${API_PORT}/api`);
  } else {
    // Production URL for non-dev builds
    urls.push("https://bookwyrm-production.example.com/api");
  }

  // Deduplicate URLs
  API_URLS = [...new Set(urls)];
  isInitialized = true;

  console.log(`Generated ${API_URLS.length} potential API URLs`);
  console.log("Priority API URL:", API_URLS[0]);
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
    const baseUrl = workingApiUrl || (API_URLS.length > 0 ? API_URLS[0] : `http://${COMPUTER_LOCAL_IP}:${API_PORT}/api`);

    // Guard against undefined/null baseUrl
    if (!baseUrl) return `http://${COMPUTER_LOCAL_IP}:${API_PORT}/api/${path || ""}`;

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
    return `http://${COMPUTER_LOCAL_IP}:${API_PORT}/api/${path || ""}`;
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
    const baseUrl = workingApiUrl || (API_URLS.length > 0 ? API_URLS[0] : `http://${COMPUTER_LOCAL_IP}:${API_PORT}/api`);
    
    // Guard against undefined/null baseUrl
    if (!baseUrl) return `http://${COMPUTER_LOCAL_IP}:${API_PORT}/media/`;

    // Get the base URL without 'api/'
    // Fix the error: Cannot read property 'replace' of undefined
    const baseUrlWithoutApi = baseUrl.toString().replace(/\/api\/?$/, "");
    return `${baseUrlWithoutApi}/media/`;
  } catch (error) {
    // Safely handle any unexpected errors and provide a fallback
    console.error("Error in getMediaUrl:", error);
    return `http://${COMPUTER_LOCAL_IP}:${API_PORT}/media/`;
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
    return `http://${COMPUTER_LOCAL_IP}:${API_PORT}/media/book_photos/`;
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
    } catch (error) {
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
};

/**
 * Get a list of all potential API URLs
 * @returns {string[]} Array of potential API URLs
 */
export const getAllApiUrls = () => {
  return [...API_URLS];
};

