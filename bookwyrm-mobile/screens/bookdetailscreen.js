import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	Alert,
	ScrollView,
	ActivityIndicator,
	Animated,
	Modal,
} from "react-native";

// Import API configuration and components
import { API_BASE_URL, getMediaUrl } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

// Import styles
import baseStyles from "../styles/baseStyles";
import bookStyles from "../styles/bookStyles";
import buttonStyles from "../styles/buttonStyles";
import { colors } from "../styles/theme";

export default function BookDetailScreen({ route, navigation }) {
	const { book: initialBook, bookId } = route.params; // Get book object or ID from navigation
	const [book, setBook] = useState(initialBook || null);
	const [loading, setLoading] = useState(!initialBook && bookId);
	const [error, setError] = useState(null);

	// Add state to track if deeper details are visible
	const [showDeeperDetails, setShowDeeperDetails] = useState(false);
	const [detailsAnimation] = useState(new Animated.Value(0));

	// Add state for photo viewer
	const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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

	// Update this useEffect to replace favorite star with back button
	useEffect(() => {
		// Replace favorite star with back button in header
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			headerRight: () => (
				<TouchableOpacity
					style={buttonStyles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={buttonStyles.backButtonText}>↩ Back</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

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
			<View style={baseStyles.fieldContainer}>
				<Text
					style={[baseStyles.fieldLabel, isEmpty && baseStyles.emptyFieldLabel]}
				>
					{label}:
				</Text>
				<Text
					style={[baseStyles.fieldValue, isEmpty && baseStyles.emptyFieldValue]}
				>
					{displayValue}
				</Text>
			</View>
		);
	};

	// New function to render genres (primary + additional)
	const renderGenres = () => {
		// Get genre display name instead of code
		const getGenreDisplayName = (code) => {
			// Map of common genre codes to display names
			const genreMap = {
				fiction: "Fiction",
				"non-fiction": "Non-Fiction",
				"sci-fi": "Science Fiction",
				fantasy: "Fantasy",
				mystery: "Mystery",
				biography: "Biography",
				history: "History",
				romance: "Romance",
				thriller: "Thriller",
				horror: "Horror",
				"young-adult": "Young Adult",
				children: "Children",
				dystopian: "Dystopian",
				utopian: "Utopian",
				supernatural: "Supernatural",
				paranormal: "Paranormal",
				"graphic-novel": "Graphic Novel",
				poetry: "Poetry",
				drama: "Drama",
				classic: "Classic",
				unknown: "Unknown",
			};

			return genreMap[code] || code;
		};

		// Handle empty genre
		if (
			!book.genre &&
			(!book.additional_genres || book.additional_genres.length === 0)
		) {
			return (
				<View style={baseStyles.fieldContainer}>
					<Text style={[baseStyles.fieldLabel, baseStyles.emptyFieldLabel]}>
						Genres:
					</Text>
					<Text style={[baseStyles.fieldValue, baseStyles.emptyFieldValue]}>
						Not specified
					</Text>
				</View>
			);
		}

		// Start with primary genre
		let genreList = [];
		if (book.genre && book.genre !== "unknown") {
			genreList.push(getGenreDisplayName(book.genre));
		}

		// Add additional genres if they exist
		if (book.additional_genres) {
			// Parse comma-separated list of additional genres
			const additionalGenres = book.additional_genres
				.split(",")
				.map((g) => g.trim())
				.filter((g) => g.length > 0 && g !== "unknown")
				.map(getGenreDisplayName);

			genreList = [...genreList, ...additionalGenres];
		}

		// Ensure we don't have duplicates
		genreList = [...new Set(genreList)];

		// Return formatted genre list
		return (
			<View style={baseStyles.fieldContainer}>
				<Text style={baseStyles.fieldLabel}>
					{genreList.length > 1 ? "Genres:" : "Genre:"}
				</Text>
				<View style={bookStyles.genreContainer}>
					{genreList.map((genre, index) => (
						<View key={index} style={bookStyles.genreBadge}>
							<Text style={bookStyles.genreBadgeText}>{genre}</Text>
						</View>
					))}
				</View>
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
			<View style={baseStyles.fieldContainer}>
				<Text style={baseStyles.fieldLabel}>{label}:</Text>
				<Text style={baseStyles.fieldValue}>
					{stars} ({numericRating.toFixed(2)})
				</Text>
			</View>
		);
	};

	// Show loading state
	if (loading) {
		return (
			<View style={baseStyles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={baseStyles.loadingText}>Loading book details...</Text>
			</View>
		);
	}

	// Show error state
	if (error) {
		return (
			<View style={baseStyles.centeredContainer}>
				<Text style={baseStyles.errorText}>Error: {error}</Text>
				<TouchableOpacity
					style={buttonStyles.primaryButton}
					onPress={fetchBookDetails}
				>
					<Text style={buttonStyles.primaryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// If no book data available
	if (!book) {
		return (
			<View style={baseStyles.centeredContainer}>
				<Text style={baseStyles.errorText}>Book not found</Text>
				<TouchableOpacity
					style={buttonStyles.primaryButton}
					onPress={() => navigation.goBack()}
				>
					<Text style={buttonStyles.primaryButtonText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const { vibes, thoughts } = extractVibesAndThoughts(book.book_notes);

	return (
		<ScrollView
			style={baseStyles.container}
			contentContainerStyle={baseStyles.scrollViewContent}
		>
			{/* Book cover image */}
			<View style={bookStyles.coverContainer}>
				{book.cover ? (
					<Image
						source={{
							uri: book.cover.startsWith("http")
								? book.cover
								: `${getMediaUrl()}covers/${book.cover.split("/").pop()}`,
						}}
						style={bookStyles.coverImage}
						resizeMode="contain"
					/>
				) : (
					<View style={bookStyles.noCoverContainer}>
						<Text style={bookStyles.noCoverText}>No cover image</Text>
					</View>
				)}
			</View>

			{/* Title and Author */}
			<View style={bookStyles.titleContainer}>
				<Text style={bookStyles.bookTitleLarge}>{book.title}</Text>
				<Text style={bookStyles.bookAuthorLarge}>by {book.author}</Text>

				{/* Low profile action buttons - now below author name */}
				<View style={baseStyles.row}>
					<TouchableOpacity
						style={buttonStyles.actionButton}
						onPress={handleEdit}
					>
						<Text style={buttonStyles.actionButtonText}>Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={buttonStyles.actionButton}
						onPress={handleDelete}
					>
						<Text style={buttonStyles.actionButtonText}>Delete</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Primary Details Section - MODIFIED to add favorite star */}
			<View style={baseStyles.sectionContainer}>
				<View style={baseStyles.sectionHeaderRow}>
					<Text style={baseStyles.sectionTitle}>Book Details</Text>
					{book && (
						<TouchableOpacity
							style={buttonStyles.favoriteButton}
							onPress={toggleFavorite}
						>
							<Text style={buttonStyles.favoriteButtonText}>
								{book.favorite ? "⭐" : "☆"}
							</Text>
						</TouchableOpacity>
					)}
				</View>
				<View style={baseStyles.sectionDivider} />

				{/* Replace the single genre field with our new genres display */}
				{renderGenres()}

				{renderField(
					"Publication Year",
					book.publication_date
						? new Date(book.publication_date).getFullYear()
						: null
				)}
			</View>

			{/* Reading Status Section */}
			<View style={baseStyles.sectionContainer}>
				<Text style={baseStyles.sectionTitle}>Reading Status</Text>
				<View style={baseStyles.sectionDivider} />

				<View style={bookStyles.statusContainer}>
					<View
						style={[
							bookStyles.statusBadge,
							book.is_read && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.is_read && bookStyles.activeStatusText,
							]}
						>
							{book.is_read ? "Read" : "Unread"}
						</Text>
					</View>

					<View
						style={[
							bookStyles.statusBadge,
							book.toBeRead && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.toBeRead && bookStyles.activeStatusText,
							]}
						>
							{book.toBeRead ? "To Be Read" : "Not on TBR"}
						</Text>
					</View>

					<View
						style={[
							bookStyles.statusBadge,
							book.shelved && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.shelved && bookStyles.activeStatusText,
							]}
						>
							{book.shelved ? "On Shelf" : "Not on Shelf"}
						</Text>
					</View>

					{/* New status badges */}
					<View
						style={[
							bookStyles.statusBadge,
							book.currently_reading && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.currently_reading && bookStyles.activeStatusText,
							]}
						>
							{book.currently_reading ? "Currently Reading" : "Not Reading"}
						</Text>
					</View>

					<View
						style={[
							bookStyles.statusBadge,
							book.did_not_finish && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.did_not_finish && bookStyles.activeStatusText,
							]}
						>
							{book.did_not_finish ? "Did Not Finish" : "Completed"}
						</Text>
					</View>

					<View
						style={[
							bookStyles.statusBadge,
							book.recommended_to_me && bookStyles.activeStatusBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.recommended_to_me && bookStyles.activeStatusText,
							]}
						>
							{book.recommended_to_me ? "Recommended" : "Not Recommended"}
						</Text>
					</View>

					<View
						style={[
							bookStyles.statusBadge,
							book.favorite && bookStyles.favoriteBadge,
						]}
					>
						<Text
							style={[
								bookStyles.statusText,
								book.favorite && bookStyles.favoriteText,
							]}
						>
							{book.favorite ? "⭐ Favorite" : "Not Favorite"}
						</Text>
					</View>
				</View>
			</View>

			{/* Conditional Rating Section - only if book is read */}
			{book.is_read && (
				<View style={baseStyles.sectionContainer}>
					<Text style={baseStyles.sectionTitle}>Rating & Impressions</Text>
					<View style={baseStyles.sectionDivider} />

					{renderRatingField("Rating", book.rating)}
					{renderField("Emoji", book.emoji || "📚")}
				</View>
			)}

			{/* Content Section - always display if there's content */}
			{(vibes || thoughts) && (
				<View style={baseStyles.sectionContainer}>
					<Text style={baseStyles.sectionTitle}>Content</Text>
					<View style={baseStyles.sectionDivider} />

					{vibes && (
						<View style={baseStyles.fieldContainer}>
							<Text style={baseStyles.fieldLabel}>Vibes:</Text>
							<Text style={baseStyles.fieldValue}>{vibes}</Text>
						</View>
					)}

					{thoughts && (
						<View style={baseStyles.fieldContainer}>
							<Text style={baseStyles.fieldLabel}>My Thoughts:</Text>
							<Text style={baseStyles.fieldValue}>{thoughts}</Text>
						</View>
					)}
				</View>
			)}

			{/* Deeper Look button */}
			<TouchableOpacity
				style={bookStyles.deeperLookButton}
				onPress={toggleDeeperDetails}
			>
				<Text style={bookStyles.deeperLookButtonText}>
					{showDeeperDetails
						? "Hide Detailed Information"
						: "Take a Deeper Look"}
				</Text>
				<Text style={bookStyles.deeperLookIcon}>
					{showDeeperDetails ? "▲" : "▼"}
				</Text>
			</TouchableOpacity>

			{/* Collapsible "Deeper Look" sections */}
			<Animated.View
				style={[
					bookStyles.deeperDetailsContainer,
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
				<View style={bookStyles.deeperSectionContainer}>
					<Text style={bookStyles.deeperSectionTitle}>Publication Details</Text>
					<View style={baseStyles.sectionDivider} />

					{renderField("Publisher", book.publisher)}
					{renderField("ISBN", book.isbn)}
					{renderField("Language", book.language)}
					{renderField("Page Count", book.page_count)}
				</View>

				{/* Tags Section */}
				<View style={bookStyles.deeperSectionContainer}>
					<Text style={bookStyles.deeperSectionTitle}>Tags & Categories</Text>
					<View style={baseStyles.sectionDivider} />

					{renderField("Tags", book.tags)}
				</View>

				{/* System Information Section */}
				<View style={bookStyles.deeperSectionContainer}>
					<Text style={bookStyles.deeperSectionTitle}>System Information</Text>
					<View style={baseStyles.sectionDivider} />

					{renderField("Created", book.created_at, formatDate)}
					{renderField("Last Updated", book.updated_at, formatDate)}
					{renderField("ID", book.id)}
				</View>

				{/* Content Warnings Section - if present */}
				{book.content_warnings && (
					<View style={bookStyles.deeperSectionContainer}>
						<Text
							style={[bookStyles.deeperSectionTitle, bookStyles.warningTitle]}
						>
							Content Warnings
						</Text>
						<View style={baseStyles.sectionDivider} />

						<View style={bookStyles.warningContainer}>
							{book.content_warnings.split(",").map((warning, index) => (
								<View key={index} style={bookStyles.warningBadge}>
									<Text style={bookStyles.warningText}>{warning.trim()}</Text>
								</View>
							))}
						</View>
					</View>
				)}
			</Animated.View>

			{/* Add Me and My Books section - after the primary details */}
			{book.myBookPhotos && book.myBookPhotos.length > 0 && (
				<View style={baseStyles.sectionContainer}>
					<Text style={baseStyles.sectionTitle}>Me and My Books</Text>
					<View style={baseStyles.sectionDivider} />

					<View style={bookStyles.photoGallery}>
						{book.myBookPhotos.map((photo, index) => (
							<TouchableOpacity
								key={index}
								style={bookStyles.photoContainer}
								onPress={() => {
									setSelectedPhotoIndex(index);
									setPhotoViewerVisible(true);
								}}
							>
								<Image
									source={{
										uri:
											photo.uri ||
											`${getMediaUrl()}book_photos/${photo.split("/").pop()}`,
									}}
									style={bookStyles.photoThumbnail}
									resizeMode="cover"
								/>
							</TouchableOpacity>
						))}
					</View>
				</View>
			)}

			{/* Photo Viewer Modal */}
			<Modal
				visible={photoViewerVisible}
				transparent={true}
				onRequestClose={() => setPhotoViewerVisible(false)}
			>
				<View style={bookStyles.photoViewerContainer}>
					<TouchableOpacity
						style={bookStyles.closeButton}
						onPress={() => setPhotoViewerVisible(false)}
					>
						<Text style={bookStyles.closeButtonText}>×</Text>
					</TouchableOpacity>

					{book.myBookPhotos && book.myBookPhotos.length > 0 && (
						<Image
							source={{
								uri:
									book.myBookPhotos[selectedPhotoIndex].uri ||
									`${getMediaUrl()}book_photos/${book.myBookPhotos[
										selectedPhotoIndex
									]
										.split("/")
										.pop()}`,
							}}
							style={bookStyles.fullSizePhoto}
							resizeMode="contain"
						/>
					)}

					{/* Photo navigation */}
					<View style={bookStyles.photoNavigation}>
						<TouchableOpacity
							style={[
								bookStyles.photoNavButton,
								selectedPhotoIndex === 0 && bookStyles.disabledNavButton,
							]}
							onPress={() =>
								setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))
							}
							disabled={selectedPhotoIndex === 0}
						>
							<Text style={bookStyles.photoNavButtonText}>←</Text>
						</TouchableOpacity>

						<Text style={bookStyles.photoCounter}>
							{selectedPhotoIndex + 1} / {book.myBookPhotos.length}
						</Text>

						<TouchableOpacity
							style={[
								bookStyles.photoNavButton,
								selectedPhotoIndex === book.myBookPhotos.length - 1 &&
									bookStyles.disabledNavButton,
							]}
							onPress={() =>
								setSelectedPhotoIndex(
									Math.min(book.myBookPhotos.length - 1, selectedPhotoIndex + 1)
								)
							}
							disabled={selectedPhotoIndex === book.myBookPhotos.length - 1}
						>
							<Text style={bookStyles.photoNavButtonText}>→</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* Bottom spacer */}
			<View style={baseStyles.bottomSpacer} />
		</ScrollView>
	);
}
