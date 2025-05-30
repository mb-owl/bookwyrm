import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Platform } from "react-native";

// Import API configuration
import { getApiEndpoint } from "./utils/apiConfig";

// Import screens
import WelcomeScreen from "./screens/welcome";
import BookListScreen from "./screens/booklistscreen";
import BookDetailScreen from "./screens/bookdetailscreen";
import BookFormScreen from "./screens/bookformscreen";
import FavoritesScreen from "./screens/favorites";
import TrashScreen from "./screens/trashscreen";

const Stack = createNativeStackNavigator();

// Check server connectivity
const checkServerConnection = async () => {
	try {
		// Use the books endpoint which definitely exists
		const endpoint = getApiEndpoint("books");
		console.log("Checking server connection to:", endpoint);

		const response = await fetch(endpoint, {
			method: "GET",
			headers: { Accept: "application/json" },
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
		// Log the error but don't show alert on startup
		console.warn(`Could not connect to the server. Error: ${error.message}`);
	}
};

export default function App() {
	useEffect(() => {
		// Small delay before checking server connectivity
		const timer = setTimeout(() => {
			checkServerConnection();
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName="WelcomeScreen"
				screenOptions={{ gestureEnabled: false }}
			>
				<Stack.Screen
					name="WelcomeScreen"
					component={WelcomeScreen}
					options={{
						title: "Welcome to BookWyrm",
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="BookListScreen"
					component={BookListScreen}
					options={{ title: "Book List" }}
				/>
				<Stack.Screen
					name="BookDetailScreen"
					component={BookDetailScreen}
					options={{ title: "Book Details" }}
				/>
				<Stack.Screen
					name="BookFormScreen"
					component={BookFormScreen}
					options={{ title: "Add/Edit Book" }}
				/>
				<Stack.Screen
					name="Favorites"
					component={FavoritesScreen}
					options={{ title: "Favorite Books" }}
				/>
				<Stack.Screen
					name="Trash"
					component={TrashScreen}
					options={{ title: "Recently Deleted" }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
