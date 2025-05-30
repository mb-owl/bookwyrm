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
	Animated,
} from "react-native";

// Import API configuration
import { API_BASE_URL, getMediaUrl } from "../utils/apiConfig";

export default function BookDetailScreen({ route, navigation }) {
	const { book: initialBook, bookId } = route.params; // Get book object or ID from navigation
	const [book, setBook] = useState(initialBook || null);
	const [loading, setLoading] = useState(!initialBook && bookId);
	const [error, setError] = useState(null);

	// Add state to track if deeper details are visible
	const [showDeeperDetails, setShowDeeperDetails] = useState(false);
	const [detailsAnimation] = useState(new Animated.Value(0));

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

	// Add this to ensure our custom header is respected
	useEffect(() => {
		// Add home button to the header and favorite star
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity
					style={styles.homeButton}
					onPress={() => navigation.navigate("WelcomeScreen")}
				>
					<Text style={styles.homeButtonText}>🏠</Text>
				</TouchableOpacity>
			),
			headerRight: () =>
				book && (
					<TouchableOpacity
						style={styles.favoriteButton}
						onPress={toggleFavorite}
					>
						<Text style={styles.favoriteButtonText}>
							{book.favorite ? "⭐" : "☆"}
						</Text>
					</TouchableOpacity>
				),
		});
	}, [navigation, book]);

	// Add function to toggle favorite status
	const toggleFavorite = async () => {
		if (!book) return;

		try {
			const updatedBook = { ...book, favorite: !book.favorite };

			// Create form data for the update
			const formData = new FormData();
			formData.append("favorite", updatedBook.favorite ? "true" : "false");

			// Update only the favorite field
			const response = await fetch(`${API_BASE_URL}/books/${book.id}/`, {
				method: "PATCH",
				body: formData,
			});

			if (response.ok) {
				// Update local state
				setBook(updatedBook);
			} else {
				console.error("Failed to update favorite status");
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
		}
	};

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

	// Toggle deeper details visibility with animation
	const toggleDeeperDetails = () => {
		const toValue = showDeeperDetails ? 0 : 1;

		Animated.timing(detailsAnimation, {
			toValue,
			duration: 300,
			useNativeDriver: false,
		}).start();

		setShowDeeperDetails(!showDeeperDetails);
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

				{/* Low profile action buttons - now below author name */}
				<View style={styles.actionButtonsContainer}>
					<TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
						<Text style={styles.actionButtonText}>Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
						<Text style={styles.actionButtonText}>Delete</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Primary Details Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Book Details</Text>
				<View style={styles.sectionDivider} />

				{renderField("Genre", book.genre)}
				{renderField(
					"Publication Year",
					book.publication_date
						? new Date(book.publication_date).getFullYear()
						: null
				)}
			</View>

			{/* Reading Status Section */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>Reading Status</Text>
				<View style={styles.sectionDivider} />

				<View style={styles.statusContainer}>
					<View
						style={[
							styles.statusBadge,
							book.is_read && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.is_read && styles.activeStatusText,
							]}
						>
							{book.is_read ? "Read" : "Unread"}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							book.toBeRead && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.toBeRead && styles.activeStatusText,
							]}
						>
							{book.toBeRead ? "To Be Read" : "Not on TBR"}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							book.shelved && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.shelved && styles.activeStatusText,
							]}
						>
							{book.shelved ? "On Shelf" : "Not on Shelf"}
						</Text>
					</View>

					{/* New status badges */}
					<View
						style={[
							styles.statusBadge,
							book.currently_reading && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.currently_reading && styles.activeStatusText,
							]}
						>
							{book.currently_reading ? "Currently Reading" : "Not Reading"}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							book.did_not_finish && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.did_not_finish && styles.activeStatusText,
							]}
						>
							{book.did_not_finish ? "Did Not Finish" : "Completed"}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							book.recommended_to_me && styles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								styles.statusText,
								book.recommended_to_me && styles.activeStatusText,
							]}
						>
							{book.recommended_to_me ? "Recommended" : "Not Recommended"}
						</Text>
					</View>

					<View
						style={[styles.statusBadge, book.favorite && styles.favoriteBadge]}
					>
						<Text
							style={[styles.statusText, book.favorite && styles.favoriteText]}
						>
							{book.favorite ? "⭐ Favorite" : "Not Favorite"}
						</Text>
					</View>
				</View>
			</View>

			{/* Conditional Rating Section - only if book is read */}
			{book.is_read && (
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Rating & Impressions</Text>
					<View style={styles.sectionDivider} />

					{renderRatingField("Rating", book.rating)}
					{renderField("Emoji", book.emoji || "📚")}
				</View>
			)}

			{/* Content Section - always display if there's content */}
			{(vibes || thoughts) && (
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Content</Text>
					<View style={styles.sectionDivider} />

					{vibes && (
						<View style={styles.fieldContainer}>
							<Text style={styles.fieldLabel}>Vibes:</Text>
							<Text style={styles.fieldValue}>{vibes}</Text>
						</View>
					)}

					{thoughts && (
						<View style={styles.fieldContainer}>
							<Text style={styles.fieldLabel}>My Thoughts:</Text>
							<Text style={styles.fieldValue}>{thoughts}</Text>
						</View>
					)}
				</View>
			)}

			{/* Deeper Look button */}
			<TouchableOpacity
				style={styles.deeperLookButton}
				onPress={toggleDeeperDetails}
			>
				<Text style={styles.deeperLookButtonText}>
					{showDeeperDetails
						? "Hide Detailed Information"
						: "Take a Deeper Look"}
				</Text>
				<Text style={styles.deeperLookIcon}>
					{showDeeperDetails ? "▲" : "▼"}
				</Text>
			</TouchableOpacity>

			{/* Collapsible "Deeper Look" sections */}
			<Animated.View
				style={[
					styles.deeperDetailsContainer,
					{
						maxHeight: detailsAnimation.interpolate({
							inputRange: [0, 1],
							outputRange: [0, 1000], // Large enough to show all content
						}),
						opacity: detailsAnimation,
					},
				]}
			>
				{/* Publication Details Section */}
				<View style={styles.deeperSectionContainer}>
					<Text style={styles.deeperSectionTitle}>Publication Details</Text>
					<View style={styles.sectionDivider} />

					{renderField("Publisher", book.publisher)}
					{renderField("ISBN", book.isbn)}
					{renderField("Language", book.language)}
					{renderField("Page Count", book.page_count)}
				</View>

				{/* Tags Section */}
				<View style={styles.deeperSectionContainer}>
					<Text style={styles.deeperSectionTitle}>Tags & Categories</Text>
					<View style={styles.sectionDivider} />

					{renderField("Tags", book.tags)}
				</View>

				{/* System Information Section */}
				<View style={styles.deeperSectionContainer}>
					<Text style={styles.deeperSectionTitle}>System Information</Text>
					<View style={styles.sectionDivider} />

					{renderField("Created", book.created_at, formatDate)}
					{renderField("Last Updated", book.updated_at, formatDate)}
					{renderField("ID", book.id)}
				</View>

				{/* Content Warnings Section - if present */}
				{book.content_warnings && (
					<View style={styles.deeperSectionContainer}>
						<Text style={[styles.deeperSectionTitle, styles.warningTitle]}>
							Content Warnings
						</Text>
						<View style={styles.sectionDivider} />

						<View style={styles.warningContainer}>
							{book.content_warnings.split(",").map((warning, index) => (
								<View key={index} style={styles.warningBadge}>
									<Text style={styles.warningText}>{warning.trim()}</Text>
								</View>
							))}
						</View>
					</View>
				)}
			</Animated.View>

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
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
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
		marginBottom: 24,
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
	actionButtonsContainer: {
		flexDirection: "row",
		marginTop: 8, // Add space between author and buttons
		justifyContent: "center", // Center the buttons horizontally
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginHorizontal: 4, // Add some space between buttons
	},
	actionButtonText: {
		fontSize: 14,
		color: "#3498db",
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
	bottomSpacer: {
		height: 40,
	},

	// Enhanced/updated styles
	statusContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginVertical: 8,
	},
	statusBadge: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		margin: 4,
		backgroundColor: "#f0f0f0",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	activeStatusBadge: {
		backgroundColor: "#e8f4fd",
		borderColor: "#007BFF",
	},
	statusText: {
		fontSize: 14,
		color: "#777",
	},
	activeStatusText: {
		color: "#007BFF",
		fontWeight: "600",
	},

	// Deeper Look section
	deeperLookButton: {
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		padding: 14,
		marginVertical: 10,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	deeperLookButtonText: {
		fontSize: 16,
		color: "#3498db",
		fontWeight: "600",
		marginRight: 8,
	},
	deeperLookIcon: {
		fontSize: 14,
		color: "#3498db",
	},
	deeperDetailsContainer: {
		overflow: "hidden",
	},
	deeperSectionContainer: {
		backgroundColor: "#f5f5f5",
		borderRadius: 10,
		padding: 16,
		marginBottom: 16,
		borderLeftWidth: 3,
		borderLeftColor: "#ddd",
	},
	deeperSectionTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#7f8c8d",
		marginBottom: 8,
	},
	warningTitle: {
		color: "#e74c3c",
	},
	warningContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 8,
	},
	warningBadge: {
		backgroundColor: "#ffebee",
		borderRadius: 16,
		paddingVertical: 6,
		paddingHorizontal: 12,
		margin: 4,
		borderWidth: 1,
		borderColor: "#ffcdd2",
	},
	warningText: {
		color: "#c62828",
		fontSize: 14,
	},
	homeButton: {
		padding: 10,
	},
	homeButtonText: {
		fontSize: 20,
	},
	favoriteButton: {
		padding: 10,
		marginRight: 5,
	},
	favoriteButtonText: {
		fontSize: 24,
	},
	favoriteBadge: {
		backgroundColor: "#fff3cd",
		borderColor: "#ffd700",
	},
	favoriteText: {
		color: "#856404",
		fontWeight: "600",
	},
});
