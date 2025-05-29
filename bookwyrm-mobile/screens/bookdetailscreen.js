import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Alert,
} from "react-native";

// Define IP addresses for different environments
const LOCAL_IP_ADDRESS = "http://192.168.0.57:8000/api";
const BASE_URL = "http://127.0.0.1:8000/api";

// Use BASE_URL for API calls
const API_BASE_URL = BASE_URL;

export default function BookDetailScreen({ route, navigation }) {
	const { book } = route.params; // book object passed from list

	const handleDelete = async () => {
		// Confirm deletion
		Alert.alert("Delete Book", "Are you sure you want to delete this book?", [
			{
				text: "Cancel",
				style: "cancel",
			},
			{
				text: "Delete",
				onPress: async () => {
					try {
						// Show deletion in progress

						// Make sure the API endpoint has the trailing slash (Django often requires this)
						const deleteUrl = `${API_BASE_URL}/books/${book.id}/`;
						console.log("Attempting to delete book at URL:", deleteUrl);

						// Call API to delete book
						const response = await fetch(deleteUrl, {
							method: "DELETE",
							// Don't set Content-Type for DELETE requests
							// as they typically don't have a body
						});

						console.log("Delete response status:", response.status);

						if (!response.ok) {
							let errorText = "";
							try {
								errorText = await response.text();
							} catch (e) {
								errorText = "Unknown error";
							}
							console.error("Server response:", errorText);
							throw new Error(`Delete failed: ${response.status} ${errorText}`);
						}

						// Success - navigate back to book list and refresh
						Alert.alert("Success", "Book deleted successfully");

						// Navigate back and pass refresh parameter
						navigation.reset({
							index: 0,
							routes: [
								{ name: "BookListScreen", params: { refresh: Date.now() } },
							],
						});
					} catch (error) {
						console.error("Error deleting book:", error);
						Alert.alert(
							"Delete Failed",
							"Could not delete the book. Please try again later. Error: " +
								error.message
						);
					}
				},
			},
		]);
	};

	const goToEditForm = () => {
		navigation.navigate("BookFormScreen", { book });
	}; // Navigate to edit form with book data

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Title:</Text>
			<Text style={styles.value}>{book.title}</Text>

			<Text style={styles.label}>Author:</Text>
			<Text style={styles.value}>{book.author}</Text>

			{book.cover ? (
				<Image
					source={{
						uri: book.cover.startsWith("http")
							? book.cover
							: `${API_BASE_URL}/media/covers/${book.cover.split("/").pop()}`,
					}}
					style={styles.coverImage}
					accessible={true}
					accessibilityLabel={`Cover image of ${book.title}`}
					onError={(e) =>
						console.error("Image load error:", e.nativeEvent.error)
					}
				/>
			) : (
				<Text style={styles.noCoverText}>No cover image available</Text>
			)}

			{/* Add buttons for edit and delete */}

			<View style={styles.buttonRow}>
				<TouchableOpacity onPress={goToEditForm} style={styles.button}>
					<Text style={styles.buttonText}>Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={handleDelete} style={styles.button}>
					<Text style={styles.buttonText}>Delete</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#fff",
	},
	label: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	value: {
		fontSize: 16,
		marginBottom: 16,
	},
	coverImage: {
		width: 100,
		height: 150,
		marginBottom: 16,
	},
	noCoverText: {
		fontStyle: "italic",
		color: "#888",
		marginBottom: 16,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#007BFF",
		borderRadius: 5,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
	},
});
