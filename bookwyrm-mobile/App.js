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

// Import API configuration and screens
import * as apiConfig from "./utils/apiConfig";
import WelcomeScreen from "./screens/welcome";
import BookListScreen from "./screens/booklistscreen";
import BookDetailScreen from "./screens/bookdetailscreen";
import BookFormScreen from "./screens/bookformscreen";
import FavoritesScreen from "./screens/favorites";
import TrashScreen from "./screens/trashscreen";

// Fallback for API endpoints if needed
const getApiEndpoint =
	apiConfig.getApiEndpoint ||
	((path) => `http://127.0.0.1:8000/api/${path || ""}`);

// Error boundary HOC
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

// Wrap screens with error boundary
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

// Network status indicator
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
		// Use the API testing function if available
		if (apiConfig.testApiConnection) {
			return await apiConfig.testApiConnection();
		}

		// Fallback to manual check
		const endpoint = getApiEndpoint("books");
		console.log("Checking server connection to:", endpoint);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const response = await fetch(endpoint, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		return response.ok;
	} catch (error) {
		console.error("Server connection error:", error);
		return false;
	}
};

export default function App() {
	const [appReady, setAppReady] = useState(false);
	const [apiConnected, setApiConnected] = useState(false);
	const [showDebugInfo, setShowDebugInfo] = useState(false);
	const [debugInfo, setDebugInfo] = useState({});

	// Initialize app and set up connection checking
	useEffect(() => {
		const initApp = async () => {
			try {
				// Small delay before checking connectivity
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const connected = await checkServerConnection();
				setApiConnected(connected);

				// Get debug info
				const debug = (await apiConfig.debugApiConnection?.()) || {};
				setDebugInfo(debug);
			} catch (error) {
				console.warn("App initialization error:", error);
			} finally {
				setAppReady(true);
			}
		};

		initApp();

		// Check connection periodically
		const intervalId = setInterval(async () => {
			const connected = await checkServerConnection();
			setApiConnected(connected);
		}, 30000);

		return () => clearInterval(intervalId);
	}, []);

	// Show debug alert
	const showDebugAlert = () => {
		Alert.alert(
			"API Connection Debug",
			`Server: ${apiConnected ? "Connected" : "Disconnected"}\n` +
				`Platform: ${debugInfo.platform || Platform.OS} (${
					Platform.isDevice ? "Device" : "Simulator"
				})\n` +
				`API URL: http://127.0.0.1:8000/api`,
			[
				{ text: "More Details", onPress: () => setShowDebugInfo(true) },
				{ text: "OK", style: "cancel" },
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
						{debugInfo.platform || Platform.OS} (
						{Platform.isDevice ? "Device" : "Simulator"})
					</Text>
				</View>

				<View style={styles.debugRow}>
					<Text style={styles.debugLabel}>API URL:</Text>
					<Text style={styles.debugValue} numberOfLines={1}>
						http://127.0.0.1:8000/api
					</Text>
				</View>

				<View style={styles.debugButtonRow}>
					<TouchableOpacity
						style={styles.debugButton}
						onPress={async () => {
							const connected = await checkServerConnection();
							setApiConnected(connected);
							const debug = (await apiConfig.debugApiConnection?.()) || {};
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

	// Show loading screen while initializing
	if (!appReady) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading BookWyrm...</Text>
			</View>
		);
	}

	// Main app UI with error boundary
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
		// Fallback UI for fatal errors
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

// Styles for network status and debug overlay
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
