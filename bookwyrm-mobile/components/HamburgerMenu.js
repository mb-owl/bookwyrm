import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HamburgerMenu() {
	const navigation = useNavigation();
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
				"WelcomeScreen",
				"BookListScreen",
				"BookFormScreen",
				"BookDetailScreen",
				"Favorites",
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

	// Menu items configuration
	const menuItems = [
		{ title: "Home", screen: "WelcomeScreen", icon: "🏠" },
		{ title: "Book Library", screen: "BookListScreen", icon: "📚" },
		{ title: "Add New Book", screen: "BookFormScreen", icon: "➕" },
		{ title: "Favorites", screen: "Favorites", icon: "⭐" },
		{ title: "Bookshelf", screen: "Bookshelf", icon: "📖" },
		{ title: "Quotes & Notes", screen: "QuotesAndNotes", icon: "✏️" },
		{ title: "My Photo Uploads", screen: "MyPhotoUploads", icon: "📷" },
	];

	return (
		<>
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
		</>
	);
}

const styles = StyleSheet.create({
	menuButton: {
		padding: 10,
	},
	menuButtonText: {
		fontSize: 24,
		color: "#2c3e50",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	dropdownMenu: {
		position: "absolute",
		top: 80,
		left: 20,
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
