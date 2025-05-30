import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Modal,
	Alert,
	StatusBar,
	Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiEndpoint } from "../utils/apiConfig";

export default function WelcomeScreen({ navigation }) {
	// Add state for menu visibility
	const [menuVisible, setMenuVisible] = useState(false);
	// Add state for reading days counter
	const [totalDaysRead, setTotalDaysRead] = useState(0);
	const [hasReadToday, setHasReadToday] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

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

	// Check if the user has already marked today as read
	const checkReadToday = async () => {
		try {
			const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
			const lastReadDate = await AsyncStorage.getItem("lastReadDate");

			if (lastReadDate === today) {
				setHasReadToday(true);
			} else {
				setHasReadToday(false);
			}
		} catch (error) {
			console.error("Error checking read status:", error);
		}
	};

	// Fetch the total days read count from backend
	const fetchTotalDaysRead = async () => {
		try {
			setIsLoading(true);
			const endpoint = getApiEndpoint("reading-stats/");

			const response = await fetch(endpoint);

			if (response.ok) {
				const data = await response.json();
				setTotalDaysRead(data.total_days_read || 0);
			} else {
				console.error("Failed to fetch reading stats:", response.status);

				// Fallback to locally stored count if backend fails
				const localCount = await AsyncStorage.getItem("totalDaysRead");
				if (localCount) {
					setTotalDaysRead(parseInt(localCount, 10));
				}
			}
		} catch (error) {
			console.error("Error fetching reading stats:", error);

			// Fallback to locally stored count
			const localCount = await AsyncStorage.getItem("totalDaysRead");
			if (localCount) {
				setTotalDaysRead(parseInt(localCount, 10));
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle the "I Read Today!" button press
	const handleReadToday = async () => {
		if (hasReadToday) {
			Alert.alert(
				"Already Recorded",
				"You've already recorded your reading for today!"
			);
			return;
		}

		try {
			setIsLoading(true);
			const today = new Date().toISOString().split("T")[0];
			const endpoint = getApiEndpoint("reading-stats/");

			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					read_date: today,
				}),
			});

			if (response.ok) {
				// Update the local state
				setTotalDaysRead((prevCount) => prevCount + 1);
				setHasReadToday(true);

				// Save to AsyncStorage as backup
				await AsyncStorage.setItem(
					"totalDaysRead",
					(totalDaysRead + 1).toString()
				);
				await AsyncStorage.setItem("lastReadDate", today);

				Alert.alert("Success!", "Your reading day has been recorded!");
			} else {
				// Fallback to local storage if backend fails
				setTotalDaysRead((prevCount) => prevCount + 1);
				setHasReadToday(true);

				await AsyncStorage.setItem(
					"totalDaysRead",
					(totalDaysRead + 1).toString()
				);
				await AsyncStorage.setItem("lastReadDate", today);

				console.error("Backend save failed, using local storage instead");
				Alert.alert(
					"Saved Locally",
					"Your reading day has been recorded locally."
				);
			}
		} catch (error) {
			console.error("Error recording reading day:", error);
			Alert.alert("Error", "Failed to record your reading day. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch data when the screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			fetchTotalDaysRead();
			checkReadToday();
		}, [])
	);

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />

			{/* Reading days counter in upper right corner */}
			<View style={styles.counterContainer}>
				<Text style={styles.counterLabel}>Days Read This Year</Text>
				<Text style={styles.counterValue}>{totalDaysRead}</Text>
			</View>

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

			{/* Add the new "I Read Today!" button */}
			<TouchableOpacity
				style={[
					styles.readTodayButton,
					hasReadToday && styles.readTodayButtonDisabled,
				]}
				onPress={handleReadToday}
				disabled={hasReadToday || isLoading}
			>
				<Text style={styles.readTodayButtonText}>
					{hasReadToday ? "✓ Read Today!" : "I Read Today!"}
				</Text>
			</TouchableOpacity>

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
	// New styles for the reading counter and button
	counterContainer: {
		position: "absolute",
		top: Platform.OS === "ios" ? 40 : 20,
		right: 20,
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	counterLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#007BFF",
		textAlign: "center",
	},
	counterValue: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#007BFF",
	},
	readTodayButton: {
		backgroundColor: "#28a745", // Green color
		paddingVertical: 15,
		paddingHorizontal: 30,
		borderRadius: 10,
		marginBottom: 20,
		marginTop: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 5,
	},
	readTodayButtonDisabled: {
		backgroundColor: "#6c757d", // Gray when already read today
	},
	readTodayButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		textAlign: "center",
	},
});
