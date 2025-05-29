import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert } from "react-native";

//screens
import booklistscreen from "./screens/booklistscreen";
import bookdetailscreen from "./screens/bookdetailscreen";
import bookformscreen from "./screens/bookformscreen";

const Stack = createNativeStackNavigator();

// Define IP addresses for different environments
const LOCAL_IP_ADDRESS = "http://192.168.0.57:8000/api";
const BASE_URL = "http://127.0.0.1:8000/api";

// Use BASE_URL for API calls
const API_BASE_URL = BASE_URL;

// Check server connectivity
const checkServerConnection = async () => {
	try {
		console.log("Checking server connection...");
		const response = await fetch(`${API_BASE_URL}/`, {
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
		Alert.alert(
			"Server Connection Error",
			`Could not connect to the server at ${API_BASE_URL}/\n\nPlease ensure your server is running and accessible.\n\nError: ${error.message}`
		);
	}
};

export default function App() {
	useEffect(() => {
		checkServerConnection();
	}, []);

	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="BookListScreen">
				<Stack.Screen
					name="BookListScreen"
					component={booklistscreen}
					options={{ title: "Book List" }}
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
			</Stack.Navigator>
		</NavigationContainer>
	);
}
