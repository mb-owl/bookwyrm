import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

export default function WelcomeScreen({ navigation }) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>BookWyrm</Text>
				<Text style={styles.subtitle}>Your Personal Library Companion</Text>
			</View>

//WHEN YOU HAVE AN IMAGE UNCOMMENT!
			{/* <View style={styles.logoContainer}>
				<Image
					source={require("../assets/icon.png")}
					style={styles.logo}
					resizeMode="contain"
				/>
			</View> */}

			<View style={styles.buttonsContainer}>
				<TouchableOpacity
					style={styles.button}
					onPress={() => navigation.navigate("BookListScreen")}
				>
					<Text style={styles.buttonText}>View My Library</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.secondaryButton]}
					onPress={() => navigation.navigate("BookFormScreen")}
				>
					<Text style={styles.buttonText}>Add New Book</Text>
				</TouchableOpacity>
			</View>

			<Text style={styles.versionText}>Version 1.0</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: 40,
	},
	title: {
		fontSize: 36,
		fontWeight: "bold",
		color: "#2c3e50",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: "#7f8c8d",
		textAlign: "center",
	},
	logoContainer: {
		marginBottom: 40,
	},
	logo: {
		width: 150,
		height: 150,
	},
	buttonsContainer: {
		width: "100%",
		maxWidth: 300,
	},
	button: {
		backgroundColor: "#3498db",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 15,
	},
	secondaryButton: {
		backgroundColor: "#2ecc71",
	},
	buttonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "500",
	},
	versionText: {
		position: "absolute",
		bottom: 20,
		color: "#95a5a6",
		fontSize: 12,
	},
});
