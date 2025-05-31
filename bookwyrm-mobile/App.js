import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
	Alert,
	Platform,
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from "react-native";

// Import API configuration safely
import * as apiConfig from "./utils/apiConfig";
const getApiEndpoint =
	apiConfig.getApiEndpoint ||
	((path) => `http://localhost:8000/api/${path || ""}`);

// Import the debug function
const debugApiConnection =
	apiConfig.debugApiConnection || (() => Promise.resolve({}));

// Import screens directly instead of using dynamic require
import WelcomeScreen from "./screens/welcome";
import BookListScreen from "./screens/booklistscreen";
import BookDetailScreen from "./screens/bookdetailscreen";
import BookFormScreen from "./screens/bookformscreen";
import FavoritesScreen from "./screens/favorites";
import TrashScreen from "./screens/trashscreen";

// Create error wrapper component for screen components
const withErrorBoundary = (ScreenComponent, screenName) => {
	return (props) => {
		try {
			return <ScreenComponent {...props} />;
		} catch (error) {
			console.error(`Error rendering ${screenName}:`, error);
			return (
				<View
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					<Text style={{ color: "red" }}>Error loading screen</Text>
					<Text>{error.message}</Text>
				</View>
			);
		}
	};
};

// Wrap each screen with error boundary
const SafeWelcomeScreen = withErrorBoundary(WelcomeScreen, "WelcomeScreen");
const SafeBookListScreen = withErrorBoundary(BookListScreen, "BookListScreen");
const SafeBookDetailScreen = withErrorBoundary(
	BookDetailScreen,
	"BookDetailScreen"
);
const SafeBookFormScreen = withErrorBoundary(BookFormScreen, "BookFormScreen");
const SafeFavoritesScreen = withErrorBoundary(
	FavoritesScreen,
	"FavoritesScreen"
);
const SafeTrashScreen = withErrorBoundary(TrashScreen, "TrashScreen");

const Stack = createNativeStackNavigator();

// Add a NetworkStatus component for better visibility into API connection
const NetworkStatusIndicator = ({ isConnected, onPress }) => (
	<TouchableOpacity
		style={[
			styles.networkIndicator,
			isConnected ? styles.networkConnected : styles.networkDisconnected,
		]}
		onPress={onPress}
	>
		<Text style={styles.networkIndicatorText}>
			{isConnected ? "API Connected" : "API Disconnected"}
		</Text>
	</TouchableOpacity>
);

// Check server connectivity
const checkServerConnection = async () => {
	try {
		// Use the books endpoint which definitely exists
		const endpoint = getApiEndpoint("books");
		console.log("Checking server connection to:", endpoint);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		const response = await fetch(endpoint, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		console.log("Server check response status:", response.status);

		if (response.ok) {
			console.log("Server connection successful");
			return true;
		} else {
			console.error("Server returned error:", response.status);
			throw new Error(`Server responded with status: ${response.status}`);
		}
	} catch (error) {
		console.error("Server connection error:", error);
		console.warn(`Could not connect to the server. Error: ${error.message}`);
		return false;
	}
};

export default function App() {
	const [appReady, setAppReady] = useState(false);
	const [apiConnected, setApiConnected] = useState(false);
	const [showDebugInfo, setShowDebugInfo] = useState(false);
	const [debugInfo, setDebugInfo] = useState({});

	useEffect(() => {
		// Initialize app and handle errors gracefully
		const initApp = async () => {
			try {
				// Small delay before checking server connectivity
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const connected = await checkServerConnection();
				setApiConnected(connected);

				// Get debug info
				const debug = await debugApiConnection();
				setDebugInfo(debug);
			} catch (error) {
				console.warn("App initialization error:", error);
			} finally {
				setAppReady(true);
			}
		};

		initApp();

		// Set up periodic API connection checks
		const intervalId = setInterval(async () => {
			const connected = await checkServerConnection();
			setApiConnected(connected);
		}, 30000); // Check every 30 seconds

		return () => clearInterval(intervalId);
	}, []);

	const showDebugAlert = () => {
		Alert.alert(
			"API Connection Debug",
			`Server: ${apiConnected ? "Connected" : "Disconnected"}\n` +
				`Platform: ${debugInfo.platform} (${
					debugInfo.isDevice ? "Device" : "Simulator"
				})\n` +
				`Device IP: ${
					debugInfo.networkInfo?.details?.ipAddress || "Unknown"
				}\n` +
				`Computer IP: ${debugInfo.computerIp || "Unknown"}\n` +
				`Active API URL: ${debugInfo.workingApiUrl || "None"}`,
			[
				{
					text: "More Details",
					onPress: () => setShowDebugInfo(true),
				},
				{
					text: "OK",
					style: "cancel",
				},
				{
					text: "Retry Connection",
					onPress: async () => {
						const connected = await checkServerConnection();
						setApiConnected(connected);
						Alert.alert(
							"Connection Test",
							connected
								? "Successfully connected to API"
								: "Failed to connect to API"
						);
					},
				},
			]
		);
	};

	// Debug overlay
	const renderDebugOverlay = () => {
		if (!showDebugInfo) return null;

		return (
			<View style={styles.debugOverlay}>
				<Text style={styles.debugTitle}>API Connection Debug</Text>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>Status:</Text>
					<Text
						style={[
							styles.debugValue,
							apiConnected ? styles.connectedText : styles.disconnectedText,
						]}
					>
						{apiConnected ? "Connected" : "Disconnected"}
					</Text>
				</View>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>Platform:</Text>
					<Text style={styles.debugValue}>
						{debugInfo.platform} ({debugInfo.isDevice ? "Device" : "Simulator"})
					</Text>
				</View>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>Device IP:</Text>
					<Text style={styles.debugValue}>
						{debugInfo.networkInfo?.details?.ipAddress || "Unknown"}
					</Text>
				</View>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>Computer IP:</Text>
					<Text style={styles.debugValue}>
						{debugInfo.computerIp || "Unknown"}
					</Text>
				</View>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>Active API URL:</Text>
					<Text style={styles.debugValue} numberOfLines={1}>
						{debugInfo.workingApiUrl || "None"}
					</Text>
				</View>

				<Text style={styles.debugSectionTitle}>Available API URLs:</Text>
				{debugInfo.apiUrls?.map((url, index) => (
					<Text key={index} style={styles.debugUrlItem} numberOfLines={1}>
						{index + 1}. {url}
					</Text>
				))}

				<View style={styles.debugButtonRow}>
					<TouchableOpacity
						style={styles.debugButton}
						onPress={async () => {
							const connected = await checkServerConnection();
							setApiConnected(connected);
							const debug = await debugApiConnection();
							setDebugInfo(debug);
						}}
					>
						<Text style={styles.debugButtonText}>Refresh</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.debugButton, styles.closeButton]}
						onPress={() => setShowDebugInfo(false)}
					>
						<Text style={styles.debugButtonText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	// Show a loading screen while initializing
	if (!appReady) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading BookWyrm...</Text>
			</View>
		);
	}

	// Add an error boundary
	try {
		return (
			<NavigationContainer>
				<Stack.Navigator
					initialRouteName="WelcomeScreen"
					screenOptions={{ gestureEnabled: false }}
				>
					<Stack.Screen
						name="WelcomeScreen"
						component={SafeWelcomeScreen}
						options={{
							title: "Welcome to BookWyrm",
							headerShown: false,
						}}
					/>
					<Stack.Screen
						name="BookListScreen"
						component={SafeBookListScreen}
						options={{ title: "Book List" }}
					/>
					<Stack.Screen
						name="BookDetailScreen"
						component={SafeBookDetailScreen}
						options={{ title: "Book Details" }}
					/>
					<Stack.Screen
						name="BookFormScreen"
						component={SafeBookFormScreen}
						options={{ title: "Add/Edit Book" }}
					/>
					<Stack.Screen
						name="Favorites"
						component={SafeFavoritesScreen}
						options={{ title: "Favorite Books" }}
					/>
					<Stack.Screen
						name="Trash"
						component={SafeTrashScreen}
						options={{ title: "Recently Deleted" }}
					/>
				</Stack.Navigator>

				{/* Network status indicator */}
				<NetworkStatusIndicator
					isConnected={apiConnected}
					onPress={showDebugAlert}
				/>

				{/* Debug overlay */}
				{renderDebugOverlay()}
			</NavigationContainer>
		);
	} catch (error) {
		// Provide a fallback UI in case of error
		console.error("Fatal error in App component:", error);
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 20,
				}}
			>
				<Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
					BookWyrm encountered an error
				</Text>
				<Text style={{ marginBottom: 20, textAlign: "center" }}>
					There was a problem loading the application. Please restart the app.
				</Text>
				<Text style={{ fontSize: 12, color: "#666" }}>
					Error details: {error.message || "Unknown error"}
				</Text>
			</View>
		);
	}
}

// Add new styles for network status and debug overlay
const styles = StyleSheet.create({
	networkIndicator: {
		position: "absolute",
		top: Platform.OS === "ios" ? 50 : 20,
		right: 10,
		paddingVertical: 5,
		paddingHorizontal: 10,
		borderRadius: 15,
		opacity: 0.8,
	},
	networkConnected: {
		backgroundColor: "#4CAF50",
	},
	networkDisconnected: {
		backgroundColor: "#F44336",
	},
	networkIndicatorText: {
		color: "white",
		fontSize: 12,
		fontWeight: "bold",
	},
	debugOverlay: {
		position: "absolute",
		top: 80,
		left: 20,
		right: 20,
		backgroundColor: "rgba(0,0,0,0.9)",
		padding: 15,
		borderRadius: 10,
		maxHeight: "80%",
	},
	debugTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	debugRow: {
		flexDirection: "row",
		marginBottom: 5,
	},
	debugLabel: {
		color: "#BBDEFB",
		width: 100,
		fontSize: 14,
	},
	debugValue: {
		color: "white",
		flex: 1,
		fontSize: 14,
	},
	connectedText: {
		color: "#4CAF50",
		fontWeight: "bold",
	},
	disconnectedText: {
		color: "#F44336",
		fontWeight: "bold",
	},
	debugSectionTitle: {
		color: "#BBDEFB",
		fontSize: 14,
		fontWeight: "bold",
		marginTop: 10,
		marginBottom: 5,
	},
	debugUrlItem: {
		color: "white",
		fontSize: 12,
		paddingVertical: 2,
	},
	debugButtonRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 15,
	},
	debugButton: {
		backgroundColor: "#2196F3",
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 5,
		marginHorizontal: 5,
	},
	closeButton: {
		backgroundColor: "#F44336",
	},
	debugButtonText: {
		color: "white",
		fontWeight: "bold",
	},
});
