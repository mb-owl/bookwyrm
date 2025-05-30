import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Platform, TouchableOpacity, Text } from "react-native";

// Import API configuration
import { API_BASE_URL } from "./utils/apiConfig";

//screens
import booklistscreen from "./screens/booklistscreen";
import bookdetailscreen from "./screens/bookdetailscreen";
import bookformscreen from "./screens/bookformscreen";

const Stack = createNativeStackNavigator();

// Check server connectivity
const checkServerConnection = async () => {
	try {
		console.log("Checking server connection to:", API_BASE_URL);
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
			`Could not connect to the server at ${API_BASE_URL}/\n\n` +
				`Please ensure your server is running and accessible.\n\n` +
				`If using a physical device, make sure it can reach your computer at ${API_BASE_URL}.\n\n` +
				`Error: ${error.message}`
		);
	}
};

export default function App() {
	useEffect(() => {
		checkServerConnection();
	}, []);

	// Custom back button that navigates to HoME instead of previous screen
	const customBackButton = (navigation) => {
		return (
			<TouchableOpacity
				onPress={() => {
					// This would ideally navigate to the HoME screen
					// For now, navigate to BookListScreen as a placeholder
					navigation.navigate("BookListScreen");

					// If you have an actual HoME screen, uncomment this:
					// navigation.navigate("HoMEScreen");
				}}
				style={{ marginLeft: 10 }}
			>
				<Text style={{ color: "#007AFF", fontSize: 16 }}>HoME</Text>
			</TouchableOpacity>
		);
	};

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName="BookListScreen"
				screenOptions={({ navigation }) => ({
					// This provides the custom back button for all screens
					headerLeft: () => customBackButton(navigation),
					// Disable the default back gesture and button
					gestureEnabled: false,
				})}
			>
				<Stack.Screen
					name="BookListScreen"
					component={booklistscreen}
					options={{
						title: "Book List",
						// For the initial screen, we might not want a back button
						headerLeft: () => null,
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
			</Stack.Navigator>
		</NavigationContainer>
	);
}
