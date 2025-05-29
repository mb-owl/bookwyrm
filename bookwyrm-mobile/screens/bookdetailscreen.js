import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Alert,
} from "react-native";

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
					// Call API to delete book
					await fetch(`http://127.0.0.1:8000/api/books/${book.id}`, {
						method: "DELETE",
					});
					// Navigate back to book list and refresh state
					navigation.goBack();
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
				<>
					<Image
						source={{
							uri: book.cover.startsWith("http")
								? book.cover
								: `http://127.0.0.1:8000/api/media/covers/${book.cover
										.split("/")
										.pop()}`,
						}}
						style={styles.coverImage}
						accessible={true}
						accessibilityLabel={`Cover image of ${book.title}`}
						onError={(e) =>
							console.error("Image load error:", e.nativeEvent.error)
						}
					/>
					{/* Fallback image in case the first one fails */}
					<Image
						source={{
							uri: `http://127.0.0.1:8000/media/covers/${book.cover
								.split("/")
								.pop()}`,
						}}
						style={[styles.coverImage, { marginTop: 8 }]}
					/>
				</>
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
