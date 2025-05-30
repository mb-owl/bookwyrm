import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Alert,
	ScrollView,
	ActivityIndicator,
} from "react-native";

// Import API configuration
import { API_BASE_URL, getMediaUrl } from "../utils/apiConfig";

export default function BookDetailScreen({ route, navigation }) {
	const { book: initialBook, bookId } = route.params; // Get book object or ID from navigation
	const [book, setBook] = useState(initialBook || null);
	const [loading, setLoading] = useState(!initialBook && bookId);
	const [error, setError] = useState(null);

	// Fetch book details if we only have the ID
	useEffect(() => {
		if (!initialBook && bookId) {
			fetchBookDetails();
		}
	}, [bookId]);

	// Log book data for debugging
	useEffect(() => {
		if (book) {
			console.log("Book data:", JSON.stringify(book, null, 2));
		}
	}, [book]);

	// Fetch book details from the API
	const fetchBookDetails = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/books/${bookId}/`);

			if (!response.ok) {
				throw new Error(`Failed to fetch book: ${response.status}`);
			}

			const data = await response.json();
			setBook(data);
		} catch (err) {
			console.error("Error fetching book details:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Extract vibes and thoughts from book_notes if the separator exists
	const extractVibesAndThoughts = (notes) => {
		if (!notes) return { vibes: "", thoughts: "" };

		if (notes.includes("--VIBES_SEPARATOR--")) {
			const [vibes, thoughts] = notes.split("--VIBES_SEPARATOR--");
			return { vibes: vibes.trim(), thoughts: thoughts.trim() };
		}

		return { vibes: "", thoughts: notes };
	};

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return "Not specified";
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	// Handle deletion
	const handleDelete = async () => {
		Alert.alert("Delete Book", "Are you sure you want to delete this book?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					try {
						setLoading(true);
						const response = await fetch(`${API_BASE_URL}/books/${book.id}/`, {
							method: "DELETE",
						});

						if (!response.ok) {
							throw new Error(`Delete failed: ${response.status}`);
						}

						Alert.alert("Success", "Book deleted successfully");
						navigation.navigate("BookListScreen", { refresh: Date.now() });
					} catch (err) {
						console.error("Error deleting book:", err);
						Alert.alert("Error", `Failed to delete book: ${err.message}`);
					} finally {
						setLoading(false);
					}
				},
			},
		]);
	};

	// Navigate to edit screen
	const handleEdit = () => {
		navigation.navigate("BookFormScreen", { book });
	};

	// Render field with label
	const renderField = (label, value, formatter = (v) => v) => {
		const isEmpty = value === null || value === undefined || value === "";
		const displayValue = isEmpty ? "Not specified" : formatter(value);

		return (
			<View style={styles.fieldContainer}>
				<Text style={[styles.fieldLabel, isEmpty && styles.emptyFieldLabel]}>
					{label}:
				</Text>
				<Text style={[styles.fieldValue, isEmpty && styles.emptyFieldValue]}>
					{displayValue}
				</Text>
			</View>
		);
	};

	// Render boolean field
	const renderBooleanField = (label, value) => {
		return renderField(label, value, (v) => (v ? "Yes" : "No"));
	};

	// Render rating with stars
	const renderRatingField = (label, value) => {
		if (!value) return renderField(label, null);

		const numericRating = parseFloat(value);
		const stars =
			"★".repeat(Math.floor(numericRating)) +
			"☆".repeat(Math.max(0, 5 - Math.floor(numericRating)));

		return (
			<View style={styles.fieldContainer}>
				<Text style={styles.fieldLabel}>{label}:</Text>
				<Text style={styles.fieldValue}>
					{stars} ({numericRating.toFixed(2)})
				</Text>
			</View>
		);
	};

	// Show loading state
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text style={styles.loadingText}>Loading book details...</Text>
			</View>
		);
	}

	// Show error state
	if (error) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Error: {error}</Text>
				<TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// If no book data available
	if (!book) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Book not found</Text>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.backButtonText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const { vibes, thoughts } = extractVibesAndThoughts(book.book_notes);

	return (
		<ScrollView style={styles.container}>
			{/* Book cover image */}
			<View style={styles.coverContainer}>
				{book.cover ? (
					<Image
						source={{
							uri: book.cover.startsWith("http")
								? book.cover
								: `${getMediaUrl()}covers/${book.cover.split("/").pop()}`,
						}}
						style={styles.coverImage}
						resizeMode="contain"
					/>
				) : (
					<View style={styles.noCoverContainer}>
						<Text style={styles.noCoverText}>No cover image</Text>
					</View>
				)}
			</View>

			{/* Title and Author */}
			<View style={styles.titleContainer}>
				<Text style={styles.bookTitle}>{book.title}</Text>
				<Text style={styles.bookAuthor}>by {book.author}</Text>
			</View>

			{/* Basic Information Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Basic Information</Text>
				<View style={styles.sectionDivider} />

				{renderField("Genre", book.genre)}
				{renderField("Publication Date", book.publication_date, formatDate)}
				{renderField("ISBN", book.isbn)}
				{renderField("Publisher", book.publisher)}
				{renderField("Language", book.language)}
				{renderField("Page Count", book.page_count)}
			</View>

			{/* Reading Status Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Reading Status</Text>
				<View style={styles.sectionDivider} />

				{renderBooleanField("Already Read", book.is_read)}
				{renderBooleanField("To Be Read", book.toBeRead)}
				{renderBooleanField("On Bookshelf", book.shelved)}
			</View>

			{/* Rating and Impressions Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Rating & Impressions</Text>
				<View style={styles.sectionDivider} />

				{renderRatingField("Rating", book.rating)}
				{renderField("Emoji", book.emoji || "📚")}
			</View>

			{/* Content Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Content</Text>
				<View style={styles.sectionDivider} />

				{renderField("Vibes", vibes)}
				{renderField("My Thoughts", thoughts)}
			</View>

			{/* Tags Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Tags & Categories</Text>
				<View style={styles.sectionDivider} />

				{renderField("Tags", book.tags)}
				{renderField("Vibes Tags", book.vibes)}
			</View>

			{/* System Information Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>System Information</Text>
				<View style={styles.sectionDivider} />

				{renderField("Created", book.created_at, formatDate)}
				{renderField("Last Updated", book.updated_at, formatDate)}
				{renderField("ID", book.id)}
			</View>

			{/* Action Buttons */}
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, styles.editButton]}
					onPress={handleEdit}
				>
					<Text style={styles.buttonText}>Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, styles.deleteButton]}
					onPress={handleDelete}
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
		backgroundColor: "#fff",
		padding: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: "#666",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#e74c3c",
		marginBottom: 20,
		textAlign: "center",
	},
	retryButton: {
		backgroundColor: "#3498db",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	retryButtonText: {
		color: "#fff",
		fontSize: 16,
	},
	backButton: {
		backgroundColor: "#3498db",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	backButtonText: {
		color: "#fff",
		fontSize: 16,
	},
	coverContainer: {
		alignItems: "center",
		marginVertical: 20,
	},
	coverImage: {
		width: 200,
		height: 300,
		borderRadius: 10,
	},
	noCoverContainer: {
		width: 200,
		height: 300,
		borderRadius: 10,
		backgroundColor: "#f0f0f0",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	noCoverText: {
		color: "#999",
		fontSize: 16,
		fontStyle: "italic",
	},
	titleContainer: {
		alignItems: "center",
		marginBottom: 20,
		paddingHorizontal: 20,
	},
	bookTitle: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		color: "#2c3e50",
		marginBottom: 8,
	},
	bookAuthor: {
		fontSize: 18,
		color: "#7f8c8d",
		textAlign: "center",
	},
	sectionContainer: {
		backgroundColor: "#f9f9f9",
		borderRadius: 10,
		padding: 16,
		marginBottom: 16,
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
	sectionDivider: {
		height: 1,
		backgroundColor: "#e0e0e0",
		marginBottom: 12,
	},
	fieldContainer: {
		marginBottom: 12,
	},
	fieldLabel: {
		fontSize: 15,
		fontWeight: "bold",
		color: "#34495e",
		marginBottom: 4,
	},
	fieldValue: {
		fontSize: 16,
		color: "#2c3e50",
		lineHeight: 24,
	},
	emptyFieldLabel: {
		color: "#95a5a6",
	},
	emptyFieldValue: {
		color: "#bdc3c7",
		fontStyle: "italic",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginVertical: 20,
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 30,
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
