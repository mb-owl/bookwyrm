import { registerRootComponent } from "expo";
import { LogBox } from "react-native";

// Suppress specific warnings that might clutter the console
LogBox.ignoreLogs([
	"Require cycle:",
	"Remote debugger",
	"Warning: componentWill",
	"Warning: Failed prop type",
	"[Hermes] TypeError",
]);

// Import the App component after setting up LogBox
import App from "./App";

// Gracefully handle any initialization errors
try {
	// Register the main component
	registerRootComponent(App);

	console.log("App successfully registered with Expo");
} catch (error) {
	console.error("Critical error during app initialization:", error);

	// Register a minimal fallback component if main app fails
	registerRootComponent(() => {
		const { View, Text, StyleSheet } = require("react-native");

		const styles = StyleSheet.create({
			container: {
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				padding: 20,
				backgroundColor: "#f0f0f0",
			},
			title: {
				fontSize: 20,
				fontWeight: "bold",
				marginBottom: 10,
				color: "#d32f2f",
			},
			message: {
				fontSize: 16,
				textAlign: "center",
				marginBottom: 20,
			},
			error: {
				fontSize: 12,
				color: "#666",
				textAlign: "center",
			},
		});

		return (
			<View style={styles.container}>
				<Text style={styles.title}>BookWyrm encountered an error</Text>
				<Text style={styles.message}>
					There was a problem loading the application. Please restart the app.
				</Text>
				<Text style={styles.error}>
					Error details: {error.message || "Unknown initialization error"}
				</Text>
			</View>
		);
	});
}
