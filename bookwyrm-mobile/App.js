import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Platform, TouchableOpacity, Text } from "react-native";

// Import API configuration
import { API_BASE_URL } from "./utils/apiConfig";

//screens
import WelcomeScreen from "./screens/welcome";
import booklistscreen from "./screens/booklistscreen";
import bookdetailscreen from "./screens/bookdetailscreen";
import bookformscreen from "./screens/bookformscreen";
import FavoritesScreen from "./screens/favorites";
import TrashScreen from "./screens/trashscreen"; // Add this import

const Stack = createNativeStackNavigator();

// Check server connectivity - FIXED to use books endpoint instead of root
const checkServerConnection = async () => {
	try {
		// Use the books endpoint which definitely exists, instead of the root endpoint
		const endpoint = `${API_BASE_URL}/books/`;
		console.log("Checking server connection to:", endpoint);

		const response = await fetch(endpoint, {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		});

		console.log("Server check response status:", response.status);

		if (response.ok) {
			console.log("Server connection successful");
		} else {
			console.error("Server returned error:", response.status);
			throw new Error(`Server responded with status: ${response.status}`);
		}
	} catch (error) {
		console.error("Server connection error:", error);
		// Don't show alert on startup - just log the error
		// This prevents the 404 popup while still allowing the app to function
		console.warn(
			`Could not connect to the server at ${API_BASE_URL}/books/\n` +
				`Error: ${error.message}`
		);
	}
};

export default function App() {
	useEffect(() => {
		// Add a small delay before checking server connectivity
		// This gives the app time to fully initialize
		const timer = setTimeout(() => {
			checkServerConnection();
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	// Custom back button that navigates to HoME instead of previous screen

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName="WelcomeScreen"
				screenOptions={({ navigation }) => ({
					// This provides the custom back button for all screens
					gestureEnabled: false,
				})}
			>
				<Stack.Screen
					name="WelcomeScreen"
					component={WelcomeScreen}
					options={{
						title: "Welcome to BookWyrm",
						headerShown: false, // Hide header for welcome screen
					}}
				/>
				<Stack.Screen
					name="BookListScreen"
					component={booklistscreen}
					options={{
						title: "Book List",
					}}
				/>
				<Stack.Screen
					name="BookDetailScreen"
					component={bookdetailscreen}
					options={{ title: "Book Details" }}
				/>
				<Stack.Screen
					name="BookFormScreen"
					component={bookformscreen}
					options={{ title: "Add/Edit Book" }}
				/>
				<Stack.Screen
					name="Favorites"
					component={FavoritesScreen}
					options={{ title: "Favorite Books" }}
				/>
				{/* Add the Trash screen */}
				<Stack.Screen
					name="Trash"
					component={TrashScreen}
					options={{ title: "Recently Deleted" }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
