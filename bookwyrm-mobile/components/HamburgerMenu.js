import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const HamburgerMenu = () => {
	const [menuVisible, setMenuVisible] = useState(false);
	const navigation = useNavigation();

	const navigateTo = (screen) => {
		setMenuVisible(false);
		navigation.navigate(screen);
	};

	return (
		<>
			<TouchableOpacity
				style={styles.hamburgerButton}
				onPress={() => setMenuVisible(true)}
			>
				<Text style={styles.hamburgerIcon}>☰</Text>
			</TouchableOpacity>

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
					<View style={styles.menuContainer}>
						<MenuItem
							icon="🏠"
							label="Home"
							onPress={() => navigateTo("WelcomeScreen")}
						/>

						<MenuItem
							icon="📚"
							label="Book Library"
							onPress={() => navigateTo("BookListScreen")}
						/>

						<MenuItem
							icon="➕"
							label="Add New Book"
							onPress={() => navigateTo("BookFormScreen")}
						/>

						<MenuItem
							icon="⭐"
							label="Favorites"
							onPress={() => navigateTo("Favorites")}
						/>

						<MenuItem
							icon="📖"
							label="Bookshelf"
							onPress={() => navigateTo("BookListScreen")}
						/>

						<MenuItem
							icon="📝"
							label="Quotes & Notes"
							onPress={() => navigateTo("WelcomeScreen")}
						/>

						<MenuItem
							icon="📷"
							label="My Photo Uploads"
							onPress={() => navigateTo("WelcomeScreen")}
						/>

						<MenuItem
							icon="🗑️"
							label="Recently Deleted"
							onPress={() => navigateTo("Trash")}
						/>
					</View>
				</TouchableOpacity>
			</Modal>
		</>
	);
};

// Extracted MenuItem component for consistency
const MenuItem = ({ icon, label, onPress }) => (
	<TouchableOpacity style={styles.menuItem} onPress={onPress}>
		<Text style={styles.menuItemIcon}>{icon}</Text>
		<Text style={styles.menuItemLabel}>{label}</Text>
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	hamburgerButton: {
		padding: 10,
	},
	hamburgerIcon: {
		fontSize: 24,
		color: "#333",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "flex-start",
		alignItems: "flex-start",
		paddingTop: 50,
		paddingLeft: 15,
	},
	menuContainer: {
		width: "75%",
		backgroundColor: "white",
		borderRadius: 15,
		paddingVertical: 10,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 20,
	},
	menuItemIcon: {
		fontSize: 20,
		marginRight: 12,
		width: 24,
		textAlign: "center",
	},
	menuItemLabel: {
		fontSize: 16,
		color: "#333",
	},
});

export default HamburgerMenu;
