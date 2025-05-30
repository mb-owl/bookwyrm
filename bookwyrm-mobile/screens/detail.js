import React, { useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Alert,
	ScrollView,
} from "react-native";

// Import API configuration
import { API_BASE_URL, getMediaUrl } from "../utils/apiConfig";

export default function BookDetailScreen({ route, navigation }) {
	const { book } = route.params; // book object passed from list

	// Debug: log the book object to see what data is available
	useEffect(() => {
		console.log("Book data in detail screen:", JSON.stringify(book, null, 2));
	}, [book]);

	// Extract vibes and thoughts from book_notes if the separator exists
	const extractVibesAndThoughts = (notes) => {
		if (!notes) return { vibes: "", thoughts: "" };

		if (notes.includes("--VIBES_SEPARATOR--")) {
			const [vibes, thoughts] = notes.split("--VIBES_SEPARATOR--");
			return { vibes: vibes.trim(), thoughts: thoughts.trim() };
		}

		return { vibes: "", thoughts: notes };
	};

	const { vibes, thoughts } = extractVibesAndThoughts(book.book_notes);

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	// Handle deletion
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
	};

	// Render a field with label, handling empty values
	const renderField = (label, value, formatter = (v) => v) => {
		const isEmpty = value === null || value === undefined || value === "";
		const displayValue = isEmpty ? "Not specified" : formatter(value);

		return (
			<View style={styles.fieldContainer}>
				<Text style={[styles.label, isEmpty && styles.emptyLabel]}>
					{label}:
				</Text>
				<Text style={[styles.value, isEmpty && styles.emptyValue]}>
					{displayValue}
				</Text>
			</View>
		);
	};

	// Render a boolean field with Yes/No values
	const renderBooleanField = (label, value) => {
		return renderField(label, value, (v) => (v ? "Yes" : "No"));
	};

	// Render rating with stars
	const renderRating = (label, value) => {
		if (value === null || value === undefined) {
			return renderField(label, null);
		}

		const numericRating = parseFloat(value);
		const stars =
			"★".repeat(Math.floor(numericRating)) +
			"☆".repeat(Math.max(0, 5 - Math.floor(numericRating)));

		return (
			<View style={styles.fieldContainer}>
				<Text style={styles.label}>{label}:</Text>
				<Text style={styles.value}>
					{stars} ({numericRating.toFixed(2)})
				</Text>
			</View>
		);
	};

	// Render debug information in development
	const renderDebugInfo = () => {
		if (!__DEV__) return null;

		return (
			<View style={styles.debugSection}>
				<Text style={styles.debugTitle}>Debug Info</Text>
				<Text style={styles.debugText}>Book ID: {book.id}</Text>
				<Text style={styles.debugText}>
					Fields: {Object.keys(book).join(", ")}
				</Text>
			</View>
		);
	};

	return (
		<ScrollView style={styles.container}>
			{/* Debug information in development */}
			{renderDebugInfo()}

			{/* Cover Image */}
			<View style={styles.coverContainer}>
				{book.cover ? (
					<Image
						source={{
							uri: book.cover.startsWith("http")
								? book.cover
								: `${getMediaUrl()}covers/${book.cover.split("/").pop()}`,
						}}
						style={styles.coverImage}
						accessible={true}
						accessibilityLabel={`Cover image of ${book.title}`}
						onError={(e) => {
							console.error("Image load error:", e.nativeEvent.error);
							console.log("Image URI:", book.cover);
						}}
					/>
				) : (
					<View style={styles.noCoverContainer}>
						<Text style={styles.noCoverText}>No cover image available</Text>
					</View>
				)}
			</View>

			{/* Title and Author (Always display prominently) */}
			<View style={styles.titleSection}>
				<Text style={styles.titleText}>{book.title || "Untitled Book"}</Text>
				<Text style={styles.authorText}>
					by {book.author || "Unknown Author"}
				</Text>
			</View>

			{/* Basic Information Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Basic Information</Text>
				<View style={styles.divider} />

				{renderField("Genre", book.genre)}
				{renderField("Publication Date", book.publication_date, formatDate)}
				{renderField("Emoji", book.emoji || "📚")}
			</View>

			{/* Status Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Reading Status</Text>
				<View style={styles.divider} />

				{renderBooleanField("Already Read", book.is_read)}
				{renderBooleanField("To Be Read", book.toBeRead)}
				{renderBooleanField("On Bookshelf", book.shelved)}
				{renderRating("Rating", book.rating)}
			</View>

			{/* Content Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Book Content</Text>
				<View style={styles.divider} />

				{/* Vibes section - always render the field */}
				{renderField("Vibes", vibes)}

				{/* Thoughts section - always render the field */}
				{renderField("My Thoughts", thoughts)}

				{/* If no vibes/thoughts were extracted, show the original book_notes */}
				{!vibes &&
					!thoughts &&
					book.book_notes &&
					renderField("Notes", book.book_notes)}
			</View>

			{/* Publishing Details Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Publishing Details</Text>
				<View style={styles.divider} />

				{renderField("Publisher", book.publisher)}
				{renderField("ISBN", book.isbn)}
				{renderField("Language", book.language)}
				{renderField("Page Count", book.page_count)}
			</View>

			{/* Tags Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Tags & Categories</Text>
				<View style={styles.divider} />

				{renderField("Tags", book.tags)}
				{renderField("Vibes Tags", book.vibes)}
			</View>

			{/* System Information Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>System Information</Text>
				<View style={styles.divider} />

				{renderField("Created", book.created_at, formatDate)}
				{renderField("Last Updated", book.updated_at, formatDate)}
				{renderField("ID", book.id)}
			</View>

			{/* Action Buttons */}
			<View style={styles.buttonRow}>
				<TouchableOpacity
					onPress={goToEditForm}
					style={[styles.button, styles.editButton]}
				>
					<Text style={styles.buttonText}>Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={handleDelete}
					style={[styles.button, styles.deleteButton]}
				>
					<Text style={styles.buttonText}>Delete</Text>
				</TouchableOpacity>
			</View>

			{/* Bottom spacer */}
			<View style={styles.bottomSpacer} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#fff",
	},
	debugSection: {
		padding: 10,
		backgroundColor: "#f8f9fa",
		borderRadius: 5,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#e9ecef",
	},
	debugTitle: {
		fontWeight: "bold",
		fontSize: 12,
		marginBottom: 5,
		color: "#6c757d",
	},
	debugText: {
		fontSize: 10,
		color: "#6c757d",
		fontFamily: "monospace",
	},
	coverContainer: {
		alignItems: "center",
		marginBottom: 20,
	},
	coverImage: {
		width: 180,
		height: 280,
		borderRadius: 8,
		marginBottom: 16,
	},
	noCoverContainer: {
		width: 180,
		height: 280,
		borderRadius: 8,
		backgroundColor: "#f0f0f0",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	noCoverText: {
		fontStyle: "italic",
		color: "#888",
		textAlign: "center",
		padding: 20,
	},
	titleSection: {
		marginBottom: 20,
		alignItems: "center",
	},
	titleText: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		color: "#1a1a1a",
		marginBottom: 8,
	},
	authorText: {
		fontSize: 18,
		color: "#4a4a4a",
		textAlign: "center",
	},
	section: {
		marginBottom: 24,
		backgroundColor: "#f9f9f9",
		borderRadius: 8,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#2c3e50",
		marginBottom: 8,
	},
	divider: {
		height: 1,
		backgroundColor: "#e0e0e0",
		marginBottom: 12,
	},
	fieldContainer: {
		marginBottom: 12,
	},
	label: {
		fontSize: 15,
		fontWeight: "bold",
		marginBottom: 4,
		color: "#34495e",
	},
	value: {
		fontSize: 16,
		marginBottom: 8,
		color: "#2c3e50",
		lineHeight: 22,
	},
	emptyLabel: {
		color: "#95a5a6",
	},
	emptyValue: {
		color: "#bdc3c7",
		fontStyle: "italic",
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 8,
		marginBottom: 24,
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		minWidth: 120,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	editButton: {
		backgroundColor: "#3498db",
	},
	deleteButton: {
		backgroundColor: "#e74c3c",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "500",
	},
	bottomSpacer: {
		height: 40,
	},
});
