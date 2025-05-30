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
	StyleSheet,
} from "react-native";

// Import API configuration and components
import {
	API_BASE_URL,
	getMediaUrl,
	getBookPhotosUrl,
	getApiEndpoint,
} from "../utils/apiConfig";
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

	// Add state for generated cover URL
	const [generatedCoverUrl, setGeneratedCoverUrl] = useState(null);
	const [coverLoading, setCoverLoading] = useState(false);
	const [coverError, setCoverError] = useState(false);
	const [autoFetchingCover, setAutoFetchingCover] = useState(false);

	// Fetch book details if we only have the ID
	useEffect(() => {
		if (!initialBook && bookId) {
			fetchBookDetails();
		} else if (
			initialBook &&
			(!initialBook.cover || initialBook.cover === "")
		) {
			// Auto-fetch cover for initial book if needed
			setAutoFetchingCover(true);
			fetchBookCover(initialBook.title, initialBook.author);
		}
	}, [bookId, initialBook]);

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
			const endpoint = getApiEndpoint(`books/${book.id}`);
			const response = await fetch(endpoint, {
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

			// Use helper function to get proper endpoint
			const endpoint = getApiEndpoint(`books/${bookId}`);
			console.log("Fetching book details from:", endpoint);

			const response = await fetch(endpoint);

			if (!response.ok) {
				throw new Error(`Failed to fetch book: ${response.status}`);
			}

			const data = await response.json();
			console.log("Received book data:", JSON.stringify(data, null, 2));

			// Process the photos for display with improved debugging
			if (data.photos && data.photos.length > 0) {
				console.log("Found photos for book:", data.photos.length);
				console.log(
					"Photos data structure:",
					typeof data.photos,
					Array.isArray(data.photos)
				);
				console.log("First photo example:", JSON.stringify(data.photos[0]));

				// Get the media URL - now points directly to book_photos directory
				const mediaUrl = getMediaUrl();
				console.log(`Media URL base:`, mediaUrl);

				// Convert the photos array to the format expected by the component
				const formattedPhotos = data.photos
					.map((photo, index) => {
						// Handle both object structure and string structure
						const photoUrl =
							photo.photo_url ||
							photo.photo ||
							(typeof photo === "string" ? photo : null);

						if (!photoUrl) {
							console.error(`Photo ${index} has no valid URL property:`, photo);
							return null;
						}

						console.log(`Photo ${index} original path:`, photoUrl);

						// If it's already a full URL, use it directly
						if (photoUrl && photoUrl.startsWith("http")) {
							console.log(`Photo ${index} is already a full URL`);
							return { uri: photoUrl };
						}

						// Get just the filename part
						const filename = photoUrl.split("/").pop();

						// Direct URL to the photo - no need to append book_photos anymore
						const photoUri = `${mediaUrl}${filename}`;
						console.log(`Photo ${index} final URI:`, photoUri);

						return {
							uri: photoUri,
							id: photo.id || index,
							originalPath: photoUrl,
						};
					})
					.filter(Boolean); // Remove any null entries

				// Add the photos to the book object
				data.myBookPhotos = formattedPhotos;
			} else {
				console.log("No photos found for this book");
				data.myBookPhotos = [];
			}

			// After loading book data, fetch a cover image if needed
			if (data && (!data.cover || data.cover === "")) {
				setAutoFetchingCover(true);
				fetchBookCover(data.title, data.author);
			}

			setBook(data);
		} catch (err) {
			console.error("Error fetching book details:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Enhanced Open Library API function
	const fetchOpenLibraryCover = async (title, author) => {
		try {
			console.log("Fetching cover from Open Library API");
			// Use the improved Open Library search endpoint
			const openLibraryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
				title
			)}&author=${encodeURIComponent(author || "")}&limit=1`;

			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch(openLibraryUrl, {
				method: "GET",
				headers: {
					Accept: "application/json",
					"User-Agent": "BookWyrm-Mobile/1.0",
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Open Library API error: ${response.status}`);
			}

			const data = await response.json();
			console.log("Open Library response received");

			// Enhanced cover search with multiple methods
			if (data.docs && data.docs.length > 0) {
				// Method 1: Try for cover_i first (most reliable)
				if (data.docs[0].cover_i) {
					const coverId = data.docs[0].cover_i;
					// Use large size for better quality
					const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
					console.log("Found Open Library cover (by ID):", coverUrl);
					setGeneratedCoverUrl(coverUrl);
					return true;
				}

				// Method 2: Try ISBN
				else if (data.docs[0].isbn && data.docs[0].isbn.length > 0) {
					const isbn = data.docs[0].isbn[0];
					const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
					console.log("Found Open Library cover (by ISBN):", coverUrl);
					setGeneratedCoverUrl(coverUrl);
					return true;
				}

				// Method 3: Try OCLC
				else if (data.docs[0].oclc && data.docs[0].oclc.length > 0) {
					const oclc = data.docs[0].oclc[0];
					const coverUrl = `https://covers.openlibrary.org/b/oclc/${oclc}-L.jpg`;
					console.log("Found Open Library cover (by OCLC):", coverUrl);
					setGeneratedCoverUrl(coverUrl);
					return true;
				}

				// Method 4: Try LCCN
				else if (data.docs[0].lccn && data.docs[0].lccn.length > 0) {
					const lccn = data.docs[0].lccn[0];
					const coverUrl = `https://covers.openlibrary.org/b/lccn/${lccn}-L.jpg`;
					console.log("Found Open Library cover (by LCCN):", coverUrl);
					setGeneratedCoverUrl(coverUrl);
					return true;
				}
			}

			throw new Error("No suitable Open Library cover found");
		} catch (error) {
			// Provide specific error messages for debugging
			if (error.name === "AbortError") {
				console.error("Open Library API request timed out");
			} else if (error.message.includes("Network request failed")) {
				console.error(
					"Network error fetching from Open Library API - check internet connection"
				);
			} else {
				console.error("Open Library cover error:", error);
			}
			throw error;
		}
	};

	// Function to fetch cover from LibraryThing API (fallback)
	const fetchLibraryThingCover = async (title, author) => {
		try {
			console.log("Trying LibraryThing Cover service");

			// Create a query string from title and author
			const query = encodeURIComponent(`${title} ${author || ""}`).substring(
				0,
				100
			);

			// Use LibraryThing's cover service which doesn't require API key for basic usage
			const coverUrl = `https://covers.openlibrary.org/a/query/${query}-L.jpg`;

			console.log("Found LibraryThing cover:", coverUrl);
			setGeneratedCoverUrl(coverUrl);
			return true;
		} catch (error) {
			console.error("LibraryThing cover error:", error);
			throw error;
		}
	};

	// Main function to fetch book cover - SIMPLIFIED to use only Open Library
	const fetchBookCover = async (title, author) => {
		if (!title) return;

		try {
			setCoverLoading(true);
			setCoverError(false);

			console.log(
				`Searching for cover for "${title}" by "${author || "Unknown author"}"`
			);

			// Try Open Library API as the primary source
			try {
				await fetchOpenLibraryCover(title, author);
				return; // Success! Return early
			} catch (openLibraryError) {
				console.log("Open Library attempt failed, trying LibraryThing...");
			}

			// If Open Library fails, try LibraryThing
			try {
				await fetchLibraryThingCover(title, author);
				return; // Success! Return early
			} catch (libraryThingError) {
				console.log("LibraryThing attempt failed");
			}

			// If all APIs fail, generate a placeholder cover with title and author
			console.log("All cover sources failed, using placeholder");
			const placeholderUrl = `https://via.placeholder.com/200x300/e0e0e0/333333?text=${encodeURIComponent(
				title
			)}`;
			setGeneratedCoverUrl(placeholderUrl);
		} catch (error) {
			console.error("All cover fetch attempts failed:", error);
			setCoverError(true);

			// Use a simple placeholder as last resort
			setGeneratedCoverUrl(
				`https://via.placeholder.com/200x300/e0e0e0/333333?text=No+Cover`
			);
		} finally {
			setCoverLoading(false);
			setAutoFetchingCover(false);
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
		// confirm delete book
		Alert.alert(
			"Delete Book",
			"This book will be moved to Recently Deleted for 30 days before being permanently removed.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							// Show loading indicator
							setLoading(true);

							// Use the API endpoint helper for consistent URL formatting
							const endpoint = getApiEndpoint(`books/${book.id}`);
							console.log("Moving book to trash:", endpoint);

							// Call API to soft delete book
							const response = await fetch(endpoint, {
								method: "DELETE",
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
								throw new Error(
									`Delete failed: ${response.status} ${errorText}`
								);
							}

							Alert.alert(
								"Success",
								"Book moved to Recently Deleted. You can find it in the menu under 'Recently Deleted' for the next 30 days."
							);

							// Navigate back to book list with refresh flag
							navigation.navigate("BookListScreen", { refresh: Date.now() });
						} catch (error) {
							console.error("Error deleting book:", error);
							Alert.alert(
								"Delete Failed",
								"Could not delete the book. Please try again later. Error: " +
									error.message
							);
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	};

	// Navigate to edit screen
	const handleEdit = () => {
		// Make sure all genre information is included when navigating to edit
		const bookWithAllGenres = { ...book };

		// Ensure additional_genres is properly formatted for the edit screen
		if (
			bookWithAllGenres.additional_genres === null ||
			bookWithAllGenres.additional_genres === undefined
		) {
			bookWithAllGenres.additional_genres = "";
		}

		navigation.navigate("BookFormScreen", { book: bookWithAllGenres });
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

	// Completely rewritten function to render genres properly
	const renderGenres = () => {
		// Get genre display name instead of code
		const getGenreDisplayName = (code) => {
			if (!code) return null;

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

			// Clean up the code and return the display name or the original code
			const trimmedCode = String(code).trim().toLowerCase();
			return genreMap[trimmedCode] || code;
		};

		// Collect all genres in a unified array
		let allGenres = [];

		// 1. Add primary genre if valid
		if (book.genre && book.genre !== "unknown") {
			allGenres.push(getGenreDisplayName(book.genre));
		}

		// 2. Process additional genres - with improved handling for different formats and NULL checks
		if (book.additional_genres) {
			try {
				// Process as string (most common format from backend)
				if (typeof book.additional_genres === "string") {
					// Handle empty string case
					if (book.additional_genres.trim() === "") {
						// Skip empty strings
					} else {
						const additionalGenreArray = book.additional_genres
							.split(",")
							.map((g) => g.trim())
							.filter((g) => g && g.length > 0 && g !== "unknown")
							.map(getGenreDisplayName)
							.filter((g) => g);

						allGenres = [...allGenres, ...additionalGenreArray];
					}
				}
				// Handle array format (less common but possible)
				else if (Array.isArray(book.additional_genres)) {
					const additionalGenreArray = book.additional_genres
						.filter((g) => g && g !== "unknown")
						.map(getGenreDisplayName)
						.filter((g) => g);

					allGenres = [...allGenres, ...additionalGenreArray];
				}
			} catch (error) {
				console.error("Error processing genres:", error);
			}
		}

		// 3. Remove duplicates from the combined list
		allGenres = [...new Set(allGenres)];

		// 4. Handle the case when no valid genres are found
		if (allGenres.length === 0) {
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

		// 5. Display all genres
		return (
			<View style={baseStyles.fieldContainer}>
				<Text style={baseStyles.fieldLabel}>
					{allGenres.length > 1 ? "Genres:" : "Genre:"}
				</Text>
				<View style={bookStyles.genreContainer}>
					{allGenres.map((genre, index) => (
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

	// Add new renderPhotos constant
	const renderPhotos = () => {
		if (!book || !book.photos || book.photos.length === 0) {
			// Check both the original photos array and the processed myBookPhotos
			if (!hasPhotos) {
				console.log("No photos to render");
				return null;
			}
		}

		return (
			<View style={baseStyles.sectionContainer}>
				<Text style={baseStyles.sectionTitle}>Book Photos</Text>
				<View style={baseStyles.sectionDivider} />

				<View style={bookStyles.photoGallery}>
					{safeBookPhotos.map((photo, index) => (
						<TouchableOpacity
							key={photo.id || index}
							style={bookStyles.photoContainer}
							onPress={() => {
								setSelectedPhotoIndex(index);
								setPhotoViewerVisible(true);
							}}
						>
							<Image
								source={{ uri: photo.uri }}
								style={bookStyles.photoThumbnail}
								resizeMode="cover"
								onError={(e) => {
									console.error(
										`Error loading photo ${index}:`,
										e.nativeEvent.error
									);
									console.error(`URI that failed:`, photo.uri);

									// Direct fallback with media URL
									const fallbackUri = `${getMediaUrl()}${
										photo.originalPath?.split("/").pop() || `photo_${index}.jpg`
									}`;
									console.log(`Trying direct fallback URI: ${fallbackUri}`);

									// Update the photo URI
									safeBookPhotos[index].uri = fallbackUri;
									setBook({ ...book });
								}}
							/>
							<View style={styles.photoIndexContainer}>
								<Text style={styles.photoIndexText}>{index + 1}</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Debug info in development */}
				{__DEV__ && (
					<View style={styles.debugContainer}>
						<Text style={styles.debugTitle}>Photo Debug Info:</Text>
						<Text style={styles.debugText}>
							Media URL Base: {getMediaUrl()}
						</Text>
						<Text style={styles.debugText}>
							Photos Count: {safeBookPhotos.length}
						</Text>
						<Text style={styles.debugText}>
							Original Photos Count: {book.photos?.length || 0}
						</Text>
						{safeBookPhotos.map((photo, i) => (
							<View key={i}>
								<Text style={styles.debugText} numberOfLines={1}>
									Photo {i + 1} URI: {photo.uri}
								</Text>
								{photo.originalPath && (
									<Text style={styles.debugText} numberOfLines={1}>
										Original Path: {photo.originalPath}
									</Text>
								)}
							</View>
						))}
					</View>
				)}
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

	// Add safe checks for book photo array
	const safeBookPhotos = book.myBookPhotos || [];
	const hasPhotos = Array.isArray(safeBookPhotos) && safeBookPhotos.length > 0;

	return (
		<ScrollView
			style={baseStyles.container}
			contentContainerStyle={baseStyles.scrollViewContent}
		>
			{/* Book cover image - UPDATED with improved error handling */}
			<View style={bookStyles.coverContainer}>
				{book.cover ? (
					<Image
						source={{
							uri: book.cover.startsWith("http")
								? book.cover
								: `${getMediaUrl()}${book.cover.split("/").pop()}`,
						}}
						style={bookStyles.coverImage}
						resizeMode="contain"
						onError={(e) => {
							console.error(
								"Error loading uploaded cover image:",
								e.nativeEvent.error
							);
							// If uploaded cover fails, try to fetch a cover online
							if (!generatedCoverUrl && !autoFetchingCover && !coverLoading) {
								console.log(
									"Uploaded cover failed to load, trying to find cover online"
								);
								fetchBookCover(book.title, book.author);
							}
						}}
					/>
				) : generatedCoverUrl ? (
					<View style={bookStyles.generatedCoverContainer}>
						<Image
							source={{ uri: generatedCoverUrl }}
							style={bookStyles.coverImage}
							resizeMode="contain"
							onError={(e) => {
								console.error(
									"Error loading generated cover image:",
									e.nativeEvent.error
								);
								console.error("Failed URL:", generatedCoverUrl);
								setCoverError(true);
								// Set a placeholder image if the generated cover fails
								setGeneratedCoverUrl(
									"https://via.placeholder.com/200x300/e0e0e0/333333?text=Cover+Error"
								);
							}}
						/>
						<Text style={bookStyles.generatedCoverLabel}>Generated Cover</Text>
					</View>
				) : coverLoading || autoFetchingCover ? (
					<View style={bookStyles.coverLoadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={bookStyles.coverLoadingText}>Finding cover...</Text>
					</View>
				) : (
					<View style={bookStyles.noCoverContainer}>
						<Text style={bookStyles.noCoverText}>
							{coverError ? "Cover not found" : "No cover image"}
						</Text>
						{!coverLoading && !book.cover && !generatedCoverUrl && (
							<TouchableOpacity
								style={bookStyles.findCoverButton}
								onPress={() => fetchBookCover(book.title, book.author)}
							>
								<Text style={bookStyles.findCoverButtonText}>Find Cover</Text>
							</TouchableOpacity>
						)}
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

			{/* Replace the inline photo section with the renderPhotos constant */}
			{renderPhotos()}

			{/* Deeper Look button - Remains below the photos section */}
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
					{renderField("Number of Chapters", book.number_of_chapters)}
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

					{hasPhotos && selectedPhotoIndex < safeBookPhotos.length && (
						<>
							<Image
								source={{ uri: safeBookPhotos[selectedPhotoIndex].uri }}
								style={bookStyles.fullSizePhoto}
								resizeMode="contain"
								onError={(e) => {
									console.error(
										`Error loading full photo:`,
										e.nativeEvent.error
									);
									console.error(
										`URI that failed:`,
										safeBookPhotos[selectedPhotoIndex].uri
									);

									// Try fallback URIs if available
									if (
										safeBookPhotos[selectedPhotoIndex].backupUris &&
										safeBookPhotos[selectedPhotoIndex].backupUris.length > 0
									) {
										const nextUri =
											safeBookPhotos[selectedPhotoIndex].backupUris.shift();
										console.log(
											`Trying fallback URI for full photo: ${nextUri}`
										);

										// Update the photo URI to try the fallback
										safeBookPhotos[selectedPhotoIndex].uri = nextUri;

										// Force a refresh
										setBook({ ...book });
									}
								}}
							/>
							{__DEV__ && (
								<Text style={styles.debugPhotoUrl}>
									{safeBookPhotos[selectedPhotoIndex].uri}
								</Text>
							)}
						</>
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
							{selectedPhotoIndex + 1} / {safeBookPhotos.length}
						</Text>

						<TouchableOpacity
							style={[
								bookStyles.photoNavButton,
								selectedPhotoIndex === safeBookPhotos.length - 1 &&
									bookStyles.disabledNavButton,
							]}
							onPress={() =>
								setSelectedPhotoIndex(
									Math.min(safeBookPhotos.length - 1, selectedPhotoIndex + 1)
								)
							}
							disabled={selectedPhotoIndex === safeBookPhotos.length - 1}
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

// Add some debug styles at the end of your existing styles
const styles = StyleSheet.create({
	debugPhotoUrl: {
		fontSize: 8,
		color: "rgba(255,255,255,0.6)",
		position: "absolute",
		bottom: 10,
		left: 10,
		right: 10,
		textAlign: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
		padding: 2,
	},
	debugContainer: {
		marginTop: 10,
		padding: 10,
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	debugTitle: {
		fontWeight: "bold",
		marginBottom: 5,
		fontSize: 12,
	},
	debugText: {
		fontSize: 10,
		color: "#666",
		marginBottom: 2,
	},
	photoIndexContainer: {
		position: "absolute",
		bottom: 2,
		right: 2,
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	photoIndexText: {
		color: "white",
		fontSize: 10,
		fontWeight: "bold",
	},
	photoOverlay: {
		position: "absolute",
		bottom: 2,
		right: 2,
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: "center",
		alignItems: "center",
	},
});
