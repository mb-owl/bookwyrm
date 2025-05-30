import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Modal,
	Alert,
} from "react-native";

export default function WelcomeScreen({ navigation }) {
	// Add state for menu visibility
	const [menuVisible, setMenuVisible] = useState(false);

	// Toggle menu visibility
	const toggleMenu = () => {
		setMenuVisible(!menuVisible);
	};

	// Navigation handler with error handling for screens that don't exist yet
	const navigateToScreen = (screenName) => {
		try {
			// List of screens that actually exist in the app
			const existingScreens = [
				"BookListScreen",
				"BookFormScreen",
				"BookDetailScreen",
			];

			if (existingScreens.includes(screenName)) {
				setMenuVisible(false);
				navigation.navigate(screenName);
			} else {
				setMenuVisible(false);
				Alert.alert(
					"Coming Soon",
					`The ${screenName} feature is under development and will be available soon!`
				);
			}
		} catch (error) {
			console.error("Navigation error:", error);
			Alert.alert("Navigation Error", "Could not navigate to this screen.");
		}
	};

	// Menu items configuration - using direct string names instead of Screens object
	const menuItems = [
		{ title: "Book Library", screen: "BookListScreen", icon: "📚" },
		{ title: "Add New Book", screen: "BookFormScreen", icon: "➕" },
		{ title: "Favorites", screen: "Favorites", icon: "⭐" },
		{ title: "Bookshelf", screen: "Bookshelf", icon: "📖" },
		{ title: "Quotes & Notes", screen: "QuotesAndNotes", icon: "✏️" },
		{ title: "My Photo Uploads", screen: "MyPhotoUploads", icon: "📷" },
	];

	return (
		<View style={styles.container}>
			{/* Hamburger Menu Button */}
			<TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
				<Text style={styles.menuButtonText}>☰</Text>
			</TouchableOpacity>

			{/* Dropdown Menu Modal */}
			<Modal
				visible={menuVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setMenuVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setMenuVisible(false)}
				>
					<View style={styles.dropdownMenu}>
						{menuItems.map((item, index) => (
							<TouchableOpacity
								key={index}
								style={styles.menuItem}
								onPress={() => navigateToScreen(item.screen)}
							>
								<Text style={styles.menuItemIcon}>{item.icon}</Text>
								<Text style={styles.menuItemText}>{item.title}</Text>
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>

			<View style={styles.header}>
				<Text style={styles.title}>BookWyrm</Text>
				<Text style={styles.subtitle}>Your Personal Library Companion</Text>
			</View>

			{/* WHEN YOU HAVE AN IMAGE UNCOMMENT! */}
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
	// Hamburger menu styles
	menuButton: {
		position: "absolute",
		top: 40,
		left: 20,
		zIndex: 100,
		padding: 10,
	},
	menuButtonText: {
		fontSize: 30,
		color: "#2c3e50",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	dropdownMenu: {
		position: "absolute",
		top: 80,
		right: 20,
		backgroundColor: "white",
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 4,
		width: 200,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	menuItemIcon: {
		fontSize: 20,
		marginRight: 12,
	},
	menuItemText: {
		fontSize: 16,
		color: "#2c3e50",
	},
});
