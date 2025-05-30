// This is a simple form screen for adding or editing books in a mobile app.
import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	Image,
	Button,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ScrollView,
	Switch,
	Platform,
	Modal,
	FlatList,
	TouchableHighlight,
	ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Import API configuration
import { API_BASE_URL } from "../utils/apiConfig";

// OpenLibrary API for book search
const BOOK_SEARCH_API = "https://openlibrary.org/search.json";
const COVER_API_BASE = "https://covers.openlibrary.org/b/id/";

export default function BookFormScreen({ route, navigation }) {
	const editingBook = route.params?.book;
	const [title, setTitle] = useState(editingBook ? editingBook.title : "");
	const [author, setAuthor] = useState(editingBook ? editingBook.author : "");
	const [genre, setGenre] = useState("unknown"); // Maintain for compatibility but don't actively use
	const [genres, setGenres] = useState(["unknown"]);
	const [bookNotes, setBookNotes] = useState(
		editingBook ? editingBook.book_notes : ""
	);
	const [rating, setRating] = useState(
		editingBook ? editingBook.rating || 0 : 0
	);
	const [ratingInput, setRatingInput] = useState(
		editingBook
			? editingBook.rating
				? editingBook.rating.toString()
				: "0"
			: "0"
	);
	const [isEditingRating, setIsEditingRating] = useState(false);
	const [isRead, setIsRead] = useState(
		editingBook ? editingBook.is_read : false
	);
	const [toBeRead, setToBeRead] = useState(
		editingBook ? editingBook.toBeRead : false
	);
	const [shelved, setShelved] = useState(
		editingBook ? editingBook.shelved : false
	);
	const [publicationYear, setPublicationYear] = useState(
		editingBook && editingBook.publication_date
			? new Date(editingBook.publication_date).getFullYear()
			: new Date().getFullYear()
	);
	const [coverImage, setCoverImage] = useState(
		editingBook ? editingBook.coverImage : null
	);
	const [uploading, setUploading] = useState(false);
	const [showYearModal, setShowYearModal] = useState(false);
	const [showGenreModal, setShowGenreModal] = useState(false);

	// Search related states
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showSearchResults, setShowSearchResults] = useState(false);
	const searchTimeout = useRef(null);

	// Emoji rating state
	const [emoji, setEmoji] = useState(
		editingBook ? editingBook.emoji || "📚" : "📚"
	);
	const [showEmojiModal, setShowEmojiModal] = useState(false);

	// Genre choices from models.py
	const GENRE_CHOICES = [
		{ label: "Fiction", value: "fiction" },
		{ label: "Non-Fiction", value: "non-fiction" },
		{ label: "Science Fiction", value: "sci-fi" },
		{ label: "Fantasy", value: "fantasy" },
		{ label: "Mystery", value: "mystery" },
		{ label: "Biography", value: "biography" },
		{ label: "History", value: "history" },
		{ label: "Romance", value: "romance" },
		{ label: "Thriller", value: "thriller" },
		{ label: "Horror", value: "horror" },
		{ label: "Unknown", value: "unknown" },
	];

	// Available emoji options for rating
	const EMOJI_OPTIONS = [
		{ emoji: "📚", description: "Book" },
		{ emoji: "❤️", description: "Love" },
		{ emoji: "😊", description: "Happy" },
		{ emoji: "😢", description: "Sad" },
		{ emoji: "🔥", description: "Fire" },
		{ emoji: "🧠", description: "Thought-provoking" },
		{ emoji: "🐉", description: "Fantasy" },
		{ emoji: "🚀", description: "Sci-fi" },
		{ emoji: "🕵️", description: "Mystery" },
		{ emoji: "👻", description: "Spooky" },
		{ emoji: "🧙‍♂️", description: "Magical" },
		{ emoji: "💔", description: "Heartbreak" },
		{ emoji: "🌟", description: "Amazing" },
		{ emoji: "😴", description: "Boring" },
		{ emoji: "🤔", description: "Confusing" },
		{ emoji: "🌶️", description: "Spicy" },
		{ emoji: "⏳", description: "Time-consuming" },
		{ emoji: "📖", description: "Classic" },
	];

	// Extract vibes from book_notes if it exists and contains the marker
	const extractVibesAndThoughts = (notes) => {
		if (!notes) return { vibes: "", thoughts: "" };

		// Check if the notes contains our separator marker
		if (notes.includes("--VIBES_SEPARATOR--")) {
			const [vibes, thoughts] = notes.split("--VIBES_SEPARATOR--");
			return { vibes: vibes.trim(), thoughts: thoughts.trim() };
		}

		// If no separator found, assume it's all thoughts
		return { vibes: "", thoughts: notes };
	};

	const { vibes: initialVibes, thoughts: initialThoughts } =
		extractVibesAndThoughts(editingBook ? editingBook.book_notes : "");

	const [vibes, setVibes] = useState(initialVibes);
	const [thoughts, setThoughts] = useState(initialThoughts);

	// Request permission for image library access
	useEffect(() => {
		(async () => {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Permission to access camera roll is required!");
			}
		})();
	}, []);

	// Genre selection logic - improved to handle empty states and defaults
	useEffect(() => {
		try {
			if (editingBook && editingBook.genre) {
				let initialGenres = [];

				// Handle case where genre is a string (needs splitting)
				if (typeof editingBook.genre === "string") {
					initialGenres = editingBook.genre
						.split(",")
						.map((g) => g.trim())
						.filter((g) => g.length > 0);
				}
				// Handle case where genre is already an array
				else if (Array.isArray(editingBook.genre)) {
					initialGenres = editingBook.genre.filter((g) => g && g.length > 0);
				}

				// Use valid genres or fall back to "unknown"
				setGenres(initialGenres.length > 0 ? initialGenres : ["unknown"]);
			} else {
				// Default to "unknown" for new books
				setGenres(["unknown"]);
			}
		} catch (error) {
			console.error("Error setting initial genres:", error);
			// Ensure we have a safe fallback
			setGenres(["unknown"]);
		}
	}, [editingBook]);

	// Search books from OpenLibrary API
	const searchBooks = async (query) => {
		if (!query || query.length < 3) {
			setSearchResults([]);
			setShowSearchResults(false);
			return;
		}

		// Clear any existing timeout
		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}

		// Set a timeout to avoid making API calls on every keystroke
		searchTimeout.current = setTimeout(async () => {
			try {
				setIsSearching(true);
				console.log("Searching for books:", query);

				// Encode the query for URL
				const encodedQuery = encodeURIComponent(query);

				// Enhanced URL to get more book information including descriptions
				const url = `${BOOK_SEARCH_API}?q=${encodedQuery}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,description,subject,first_sentence`;

				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Search failed: ${response.status}`);
				}

				const data = await response.json();

				if (data.docs && data.docs.length > 0) {
					// Format the results
					const formattedResults = await Promise.all(
						data.docs.map(async (book) => {
							// Get additional book details if available
							let description = book.description || "";
							let firstSentence = book.first_sentence || "";

							// If we have a key but no description, try to fetch additional details
							if (book.key && (!description || description.length < 10)) {
								try {
									const workUrl = `https://openlibrary.org${book.key}.json`;
									const workResponse = await fetch(workUrl);
									if (workResponse.ok) {
										const workData = await workResponse.json();
										if (workData.description) {
											if (typeof workData.description === "object") {
												description = workData.description.value || "";
											} else {
												description = workData.description;
											}
										}
									}
								} catch (error) {
									console.log("Error fetching additional book details:", error);
								}
							}

							return {
								key: book.key || `${book.title}-${Math.random()}`,
								title: book.title || "Unknown Title",
								author: book.author_name
									? book.author_name.join(", ")
									: "Unknown Author",
								publishedYear: book.first_publish_year || null,
								coverId: book.cover_i || null,
								description: description,
								firstSentence: firstSentence,
								subject: book.subject || [],
							};
						})
					);

					setSearchResults(formattedResults);
					setShowSearchResults(true);
				} else {
					setSearchResults([]);
					setShowSearchResults(false);
				}
			} catch (error) {
				console.error("Error searching books:", error);
				Alert.alert(
					"Search Error",
					"Failed to search for books. Please try again."
				);
				setSearchResults([]);
				setShowSearchResults(false);
			} finally {
				setIsSearching(false);
			}
		}, 800);
	};

	// Handle selection of a book from search results
	const selectBook = (book) => {
		setTitle(book.title);
		setAuthor(book.author);

		if (book.publishedYear) {
			setPublicationYear(book.publishedYear);
		}

		// IMPROVED: Create better book description with enhanced synopsis
		let vibesText = "";

		// PRIORITY 1: ALWAYS create constructed vibe based on metadata
		if (book.title && book.author) {
			vibesText = `${book.title} by ${book.author}`;

			if (book.publishedYear) {
				vibesText += `, published in ${book.publishedYear}`;
			}

			if (book.subject && book.subject.length > 0) {
				const subjectList = book.subject.slice(0, 3).join(", ");
				vibesText += `. Categories include ${subjectList}.`;
			}
		}

		// PRIORITY 2: Add a proper synopsis focused on plot/content
		if (book.description && book.description.length > 0) {
			// Clean up description
			let desc = book.description;
			if (typeof desc === "object" && desc.value) {
				desc = desc.value;
			}

			// IMPROVED: Extract a proper plot summary rather than just first sentences
			vibesText += "\n\nSynopsis: ";

			// Look for patterns that suggest a plot summary
			// Common phrases that often precede a plot summary
			const plotMarkers = [
				"the story of",
				"follows the",
				"centers on",
				"is about",
				"tells the story",
				"chronicles",
				"focuses on",
				"revolves around",
				"depicts",
				"narrates",
			];

			// Look for sentences containing plot markers
			const sentences = desc.split(/[.!?]+/).filter((s) => s.trim().length > 0);
			let plotSentences = [];

			// First pass: look for sentences with plot markers
			for (const sentence of sentences) {
				const lowerSentence = sentence.toLowerCase();
				if (plotMarkers.some((marker) => lowerSentence.includes(marker))) {
					plotSentences.push(sentence.trim());
				}
			}

			// If we didn't find any plot-specific sentences, use a different approach
			if (plotSentences.length === 0) {
				// For fiction: prioritize sentences that mention characters, settings, or conflicts
				// For non-fiction: prioritize sentences that mention main topics
				const isFiction =
					!book.subject ||
					book.subject.some(
						(s) =>
							s.toLowerCase().includes("fiction") ||
							s.toLowerCase().includes("novel")
					);

				if (isFiction) {
					// For fiction, look for character names (capitalized words not at sentence start)
					// and setting/time indicators
					for (const sentence of sentences) {
						if (
							// Look for potential character names (capitalized words not at start)
							/\s[A-Z][a-z]+/.test(sentence) ||
							// Look for setting/time words
							/world|kingdom|city|town|village|century|era|age|time|journey|quest|adventure/.test(
								sentence.toLowerCase()
							)
						) {
							plotSentences.push(sentence.trim());
						}
					}
				} else {
					// For non-fiction, prioritize sentences with informative language
					for (const sentence of sentences) {
						if (
							/explores|examines|investigates|analyzes|presents|discusses|explains|reveals|argues|demonstrates/.test(
								sentence.toLowerCase()
							)
						) {
							plotSentences.push(sentence.trim());
						}
					}
				}
			}

			// If we still don't have good sentences, fall back to the first 2-3 meaningful sentences
			if (plotSentences.length === 0) {
				// Skip very short sentences and take the first 2-3 substantial ones
				plotSentences = sentences
					.filter((s) => s.split(/\s+/).length > 6) // Only sentences with more than 6 words
					.slice(0, 3);
			}

			// Limit to 2-3 sentences or 250 characters for the synopsis
			let finalSynopsis = "";
			for (let i = 0; i < Math.min(3, plotSentences.length); i++) {
				if ((finalSynopsis + plotSentences[i]).length < 250) {
					finalSynopsis += plotSentences[i].trim() + ". ";
				} else {
					break;
				}
			}

			// If we have a synopsis, add it; otherwise use a processed version of the description
			if (finalSynopsis.trim().length > 0) {
				vibesText += finalSynopsis.trim();
			} else if (desc.length > 0) {
				// Fall back to a truncated description
				vibesText += desc.length > 200 ? desc.substring(0, 197) + "..." : desc;
			}
		}
		// Fallback to first sentence as last resort
		else if (book.firstSentence && book.firstSentence.length > 0) {
			vibesText += '\n\nOpening line: "' + book.firstSentence.trim() + '"';
		}

		// Set the vibes text (including both metadata and synopsis if available)
		setVibes(vibesText);

		// Map subjects to genres if possible
		if (book.subject && book.subject.length > 0) {
			const matchedGenres = book.subject
				.flatMap((subject) => {
					const lowerSubject = subject.toLowerCase();
					return GENRE_CHOICES.filter((genre) =>
						lowerSubject.includes(genre.value)
					).map((genre) => genre.value);
				})
				.filter((value, index, self) => self.indexOf(value) === index);

			if (matchedGenres.length > 0) {
				setGenres(matchedGenres);
			}
		}

		// Set cover image if available
		if (book.coverId) {
			setCoverImage({
				uri: `${COVER_API_BASE}${book.coverId}-L.jpg`,
				isFromApi: true,
			});
		}

		// Hide search results
		setShowSearchResults(false);
	};

	const pickImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				quality: 1,
			});
			if (!result.canceled) {
				setCoverImage(result);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			Alert.alert("Error picking image. Please try again.");
		}
	};

	// Toggle a genre in the selection
	const toggleGenre = (value) => {
		try {
			// Make a copy of the current genres for safety
			const currentGenres = [...genres];

			if (currentGenres.includes(value)) {
				// Don't allow removing the last genre - replace it with "unknown" instead
				if (currentGenres.length === 1) {
					setGenres(["unknown"]);
				} else {
					setGenres(currentGenres.filter((g) => g !== value));
				}
			} else {
				// If adding a real genre and "unknown" is the only current genre, remove "unknown"
				if (
					currentGenres.length === 1 &&
					currentGenres[0] === "unknown" &&
					value !== "unknown"
				) {
					setGenres([value]);
				} else {
					setGenres([...currentGenres, value]);
				}
			}
		} catch (error) {
			console.error("Error toggling genre:", error);
			Alert.alert(
				"Error",
				"There was a problem updating genres. Please try again."
			);
		}
	};

	// Get display text for selected genres
	const getSelectedGenresText = () => {
		if (genres.length === 0) return "Select genres";

		if (genres.length === 1) {
			const selected = GENRE_CHOICES.find((g) => g.value === genres[0]);
			return selected ? selected.label : "Select genres";
		}

		return `${genres.length} genres selected`;
	};

	// Format rating for display with two decimal places
	const formatRating = (value) => {
		if (typeof value === "string" && (value === "" || value === ".")) {
			return value;
		}
		return parseFloat(value).toFixed(2);
	};

	// Handle rating input with natural typing behavior
	const handleRatingChange = (text) => {
		// Remove any non-numeric characters except decimal point
		let cleanedText = text.replace(/[^0-9.]/g, "");

		// Only allow one decimal point
		const decimalCount = (cleanedText.match(/\./g) || []).length;
		if (decimalCount > 1) {
			const parts = cleanedText.split(".");
			cleanedText = parts[0] + "." + parts.slice(1).join("");
		}

		// Store the input text first
		setRatingInput(cleanedText);

		// Then parse and apply the rating value if valid
		// Only if we have a valid number to parse
		if (cleanedText !== "" && cleanedText !== ".") {
			const numValue = parseFloat(cleanedText);
			// Check if it's a valid number and <= 5
			if (!isNaN(numValue)) {
				// Only apply the 5 max limit when the input is complete
				const limitedValue = numValue > 5 ? 5 : numValue;
				setRating(limitedValue);
			}
		} else {
			// Empty input or just a decimal point
			setRating(0);
		}
	};

	// Handle focus on rating input - don't use toString which can cause issues
	const handleRatingFocus = () => {
		setIsEditingRating(true);

		// Clear the input or set to current rating value without formatting
		if (rating === 0) {
			setRatingInput("");
		} else {
			// Remove trailing zeros for cleaner editing
			const ratingStr = rating.toString();
			setRatingInput(
				ratingStr.endsWith(".00") ? ratingStr.slice(0, -3) : ratingStr
			);
		}
	};

	// Handle blur on rating input
	const handleRatingBlur = () => {
		setIsEditingRating(false);
		// When blurring, format the value and ensure it's valid
		const numValue = parseFloat(ratingInput) || 0;
		setRating(numValue);
		setRatingInput(formatRating(numValue));
	};

	// Helper function to adjust rating by 0.25
	const adjustRating = (increment) => {
		let newRating = parseFloat(rating);
		if (increment) {
			newRating = Math.min(5, newRating + 0.25);
		} else {
			newRating = Math.max(0, newRating - 0.25);
		}
		setRating(newRating);
		setRatingInput(newRating.toString());
	};

	// Get star display for current rating value
	const getStarDisplay = (position) => {
		const diff = rating - position;

		if (diff >= 1) return "★"; // Full star
		if (diff >= 0.75) return "¾"; // Three-quarter star
		if (diff >= 0.5) return "½"; // Half star
		if (diff >= 0.25) return "¼"; // Quarter star
		return "☆"; // Empty star
	};

	// Generate array of years from 1900 to current year
	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1899 },
		(_, i) => currentYear - i
	);

	// Update search when title or author changes
	const handleTitleChange = (text) => {
		setTitle(text);
		if (text.length >= 3) {
			setSearchQuery(text);
			searchBooks(text);
		} else {
			setShowSearchResults(false);
		}
	};

	const handleAuthorChange = (text) => {
		setAuthor(text);
		if (title && title.length >= 2 && text.length >= 2) {
			setSearchQuery(`${title} ${text}`);
			searchBooks(`${title} ${text}`);
		}
	};

	// Update read/unread UI logic
	const handleReadToggle = (value) => {
		setIsRead(value);
		if (!value) {
			// If marking as unread, reset rating to 0
			setRating(0);
			setRatingInput("0");
			setThoughts("");
		}
	};

	// UPDATED: Handle the form submission with improved error handling and debugging
	const handleSubmit = async () => {
		if (!title || !author) {
			Alert.alert("Title and author are required fields.");
			return;
		}

		setUploading(true);
		try {
			console.log("Creating form data...");
			let formData = new FormData();
			formData.append("title", title);
			formData.append("author", author);

			// Simplified genre handling - just send a single valid genre string
			// Django model expects a single value from choices, not a comma-separated list
			try {
				// Get the first valid genre or use "unknown"
				const genreValue = genres && genres.length > 0 ? genres[0] : "unknown";
				formData.append("genre", genreValue);
				console.log("Genre value being sent:", genreValue);
			} catch (genreError) {
				console.error("Error processing genres:", genreError);
				formData.append("genre", "unknown");
			}

			// Combine vibes and thoughts into book_notes with a separator
			const combinedNotes = vibes
				? `${vibes}--VIBES_SEPARATOR--${thoughts}`
				: thoughts;

			formData.append("book_notes", combinedNotes);

			// Format rating properly - server might be strict about decimal format
			const numericRating = parseFloat(rating) || 0;
			formData.append("rating", numericRating.toFixed(2));
			console.log("Rating value being sent:", numericRating.toFixed(2));

			// Boolean fields - make sure format matches what Django expects
			formData.append("is_read", isRead ? "true" : "false");
			formData.append("toBeRead", toBeRead ? "true" : "false");
			formData.append("shelved", shelved ? "true" : "false");

			// Create a proper date string for Django DateField (YYYY-MM-DD)
			const dateObj = new Date(publicationYear, 0, 1);
			const formattedDate = dateObj.toISOString().split("T")[0];
			formData.append("publication_date", formattedDate);
			console.log("Publication date being sent:", formattedDate);

			// IMPROVED: Better cover image handling for server compatibility
			if (coverImage) {
				console.log("Processing cover image...");
				let uri;

				// Handle API cover images
				if (coverImage.isFromApi) {
					// For API images, we'll need to download and then upload them
					console.log("Cover is from API, skipping for now");
					// Skip sending API images as they might cause server errors
				}
				// Handle local image picker results
				else if (!coverImage.canceled) {
					// Check if image is in the new format with assets array
					if (coverImage.assets && coverImage.assets.length > 0) {
						uri = coverImage.assets[0].uri;
					}
					// Fall back to old format if needed
					else if (coverImage.uri) {
						uri = coverImage.uri;
					}

					if (uri) {
						const fileName = uri.split("/").pop() || "cover.jpg";
						const match = /\.(\w+)$/.exec(fileName);
						const fileType = match ? `image/${match[1]}` : "image/jpeg";

						console.log("Adding cover to form data:", {
							uri,
							name: fileName,
							type: fileType,
						});

						try {
							// Use 'cover' field name to match Django model
							formData.append("cover", {
								uri: uri,
								name: fileName,
								type: fileType,
							});
						} catch (imageError) {
							console.error("Error appending image to form data:", imageError);
						}
					}
				} else {
					console.log("No cover image to upload");
				}
			}

			// Use API_BASE_URL for consistent API access
			const url = editingBook
				? `${API_BASE_URL}/books/${editingBook.id}/` // update existing book
				: `${API_BASE_URL}/books/`; // create new book

			const method = editingBook ? "PUT" : "POST";

			console.log("Submitting to URL:", url, "Method:", method);
			console.log("Form data keys:", Object.fromEntries(formData._parts || []));

			// IMPROVED: Try to diagnose 500 error with better logging
			let response;
			try {
				// First try without the image to see if that's causing the issue
				const formDataWithoutImage = new FormData();
				formData._parts.forEach((part) => {
					if (part[0] !== "cover") {
						formDataWithoutImage.append(part[0], part[1]);
					}
				});

				// Only include basic fields for diagnosis
				response = await fetch(url, {
					method: method,
					body: formData,
					headers: {
						Accept: "application/json",
					},
				});

				console.log("Response status:", response.status);
			} catch (fetchError) {
				console.error("Network error during fetch:", fetchError);
				throw new Error(`Network error: ${fetchError.message}`);
			}

			if (!response.ok) {
				let errText = "";
				try {
					const errJson = await response.json();
					errText = JSON.stringify(errJson);
					console.error("Server JSON error:", errJson);
				} catch (jsonError) {
					try {
						errText = await response.text();
						console.error("Server text error:", errText);
					} catch (textError) {
						errText = "Could not read error response";
					}
				}
				throw new Error(`Server error (${response.status}): ${errText}`);
			}

			Alert.alert("Success", "Book saved successfully!");
			// Navigate back with refresh parameter
			navigation.navigate("BookListScreen", { refresh: Date.now() });
		} catch (error) {
			console.error("Error saving book:", error);

			// IMPROVED: More specific error message for 500 errors
			if (error.message.includes("500")) {
				Alert.alert(
					"Server Error",
					"The server encountered an internal error. This might be because:\n\n" +
						"1. There may be an issue with the data format\n" +
						"2. The server might have validation rules we're not meeting\n" +
						"3. There could be a problem with the image upload\n\n" +
						"Try submitting without an image or with different field values.\n\n" +
						"Error details: " +
						error.message
				);
			} else {
				Alert.alert(
					"Network Error",
					"Failed to connect to the server. Please check:\n\n" +
						"1. Your server is running at " +
						API_BASE_URL +
						"\n" +
						"2. You're connected to the same network\n" +
						"3. If using a real device, make sure it can reach your computer\n\n" +
						"Error details: " +
						error.message
				);
			}
		} finally {
			setUploading(false);
		}
	};

	// Component rendering
	return (
		<ScrollView style={styles.container}>
			{/* Title field with search */}
			<Text style={styles.label}>Title:</Text>
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.input}
					value={title}
					onChangeText={handleTitleChange}
					placeholder="Enter book title to search..."
				/>
				{isSearching && (
					<ActivityIndicator
						style={styles.searchIndicator}
						size="small"
						color="#007BFF"
					/>
				)}
			</View>

			{/* Author field with search */}
			<Text style={styles.label}>Author:</Text>
			<TextInput
				style={styles.input}
				value={author}
				onChangeText={handleAuthorChange}
				placeholder="Author name(s)"
			/>

			{/* Book search results */}
			{showSearchResults && searchResults.length > 0 && (
				<View style={styles.searchResultsContainer}>
					<Text style={styles.searchResultsTitle}>
						Select a book to auto-fill:
					</Text>
					<FlatList
						data={searchResults}
						keyExtractor={(item) => item.key}
						style={styles.searchResultsList}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={styles.searchResultItem}
								onPress={() => selectBook(item)}
								activeOpacity={0.7}
							>
								<View style={styles.searchResultContent}>
									{item.coverId ? (
										<Image
											source={{ uri: `${COVER_API_BASE}${item.coverId}-M.jpg` }}
											style={styles.resultThumbnail}
											resizeMode="contain"
										/>
									) : (
										<View style={styles.noThumbnail}>
											<Text style={styles.noThumbnailText}>No Cover</Text>
										</View>
									)}
									<View style={styles.resultTextContainer}>
										<Text style={styles.resultTitle} numberOfLines={2}>
											{item.title}
										</Text>
										<Text style={styles.resultAuthor} numberOfLines={1}>
											{item.author}
										</Text>
										{item.publishedYear && (
											<Text style={styles.resultYear}>
												{item.publishedYear}
											</Text>
										)}
									</View>
								</View>
							</TouchableOpacity>
						)}
					/>
				</View>
			)}

			{/* Genre selection */}
			<Text style={styles.label}>Genres (select multiple):</Text>
			<TouchableOpacity
				style={styles.dropdownButton}
				onPress={() => setShowGenreModal(true)}
			>
				<Text style={styles.dropdownButtonText}>{getSelectedGenresText()}</Text>
			</TouchableOpacity>

			{/* Genre selection modal */}
			<Modal
				visible={showGenreModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowGenreModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Genres</Text>

						<FlatList
							data={GENRE_CHOICES}
							keyExtractor={(item) => item.value}
							renderItem={({ item }) => (
								<TouchableHighlight
									underlayColor="#f0f0f0"
									onPress={() => toggleGenre(item.value)}
									style={styles.genreItem}
								>
									<View style={styles.genreItemRow}>
										<Text style={styles.genreItemText}>{item.label}</Text>
										<View style={styles.checkbox}>
											{genres.includes(item.value) && (
												<View style={styles.checkboxSelected} />
											)}
										</View>
									</View>
								</TouchableHighlight>
							)}
						/>

						<View style={styles.modalButtonRow}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowGenreModal(false)}
							>
								<Text style={styles.modalButtonText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<View style={styles.sectionSpacer} />

			{/* Vibes/Description field */}
			<Text style={[styles.label, { color: "#007BFF" }]}>Vibes:</Text>
			<TextInput
				style={[styles.input, styles.textArea]}
				value={vibes}
				onChangeText={setVibes}
				placeholder="Brief synopsis or description of the book's vibe..."
				multiline
				numberOfLines={3}
			/>

			<View style={styles.sectionSpacer} />

			{/* Reading status toggles */}
			<View style={styles.switchContainer}>
				<Text style={styles.label}>Already Read:</Text>
				<Switch
					value={isRead}
					onValueChange={handleReadToggle}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={isRead ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			<View style={styles.switchContainer}>
				<Text style={styles.label}>To Be Read:</Text>
				<Switch
					value={toBeRead}
					onValueChange={setToBeRead}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={toBeRead ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			<View style={styles.switchContainer}>
				<Text style={styles.label}>On Bookshelf:</Text>
				<Switch
					value={shelved}
					onValueChange={setShelved}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={shelved ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			{/* Conditional Rating Section - only show if book is read */}
			{isRead && (
				<>
					<View style={styles.sectionSpacer} />
					<Text style={styles.label}>Rating (0-5):</Text>
					<View style={styles.ratingContainer}>
						<View style={styles.ratingInputRow}>
							<TouchableOpacity
								style={styles.ratingButton}
								onPress={() => adjustRating(false)}
							>
								<Text style={styles.ratingButtonText}>-</Text>
							</TouchableOpacity>

							<TextInput
								style={[styles.input, styles.ratingInput]}
								value={isEditingRating ? ratingInput : formatRating(rating)}
								onChangeText={handleRatingChange}
								onFocus={handleRatingFocus}
								onBlur={handleRatingBlur}
								keyboardType="decimal-pad"
								placeholder="0.00 - 5.00"
								maxLength={4} // Limit to format like "5.00"
							/>

							<TouchableOpacity
								style={styles.ratingButton}
								onPress={() => adjustRating(true)}
							>
								<Text style={styles.ratingButtonText}>+</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.ratingScale}>
							{[1, 2, 3, 4, 5].map((position) => (
								<TouchableOpacity
									key={position}
									onPress={() => {
										// If clicking on a star close to current value, use quarter increments
										const currentWhole = Math.floor(rating);
										if (position === currentWhole + 1 && rating % 1 !== 0) {
											// Increment by 0.25 within the current star
											const fraction = rating % 1;
											if (fraction < 0.25) setRating(currentWhole + 0.25);
											else if (fraction < 0.5) setRating(currentWhole + 0.5);
											else if (fraction < 0.75) setRating(currentWhole + 0.75);
											else setRating(position);
										} else {
											setRating(position);
										}
									}}
									style={styles.starButton}
								>
									<Text
										style={[
											styles.starText,
											rating >= position
												? styles.starFilled
												: rating >= position - 0.25
												? styles.starQuarter
												: rating >= position - 0.5
												? styles.starHalf
												: rating >= position - 0.75
												? styles.starThreeQuarter
												: styles.starEmpty,
										]}
									>
										{getStarDisplay(position - 1)}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						<Text style={styles.ratingHelp}>
							Tip: Click +/- for 0.25 increments or tap stars for quick ratings
						</Text>
					</View>

					<View style={styles.sectionSpacer} />

					<Text style={styles.label}>Emoji Rating:</Text>
					<TouchableOpacity
						style={styles.emojiButton}
						onPress={() => setShowEmojiModal(true)}
					>
						<Text style={styles.emojiDisplay}>{emoji}</Text>
						<Text style={styles.emojiButtonText}>Change Emoji</Text>
					</TouchableOpacity>

					{/* Emoji selection modal */}
					<Modal
						visible={showEmojiModal}
						transparent={true}
						animationType="slide"
						onRequestClose={() => setShowEmojiModal(false)}
					>
						<View style={styles.modalOverlay}>
							<View style={styles.modalContent}>
								<Text style={styles.modalTitle}>Select Emoji Rating</Text>

								<FlatList
									data={EMOJI_OPTIONS}
									keyExtractor={(item) => item.emoji}
									numColumns={4}
									renderItem={({ item }) => (
										<TouchableOpacity
											onPress={() => {
												setEmoji(item.emoji);
												setShowEmojiModal(false);
											}}
											style={styles.emojiOption}
										>
											<Text style={styles.emojiText}>{item.emoji}</Text>
											<Text style={styles.emojiDescription} numberOfLines={1}>
												{item.description}
											</Text>
										</TouchableOpacity>
									)}
								/>

								<View style={styles.modalButtonRow}>
									<TouchableOpacity
										style={[styles.modalButton, styles.cancelButton]}
										onPress={() => setShowEmojiModal(false)}
									>
										<Text style={styles.modalButtonText}>Close</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</Modal>

					<View style={styles.sectionSpacer} />

					{/* Thoughts section - only for read books */}
					<Text style={styles.label}>My thoughts:</Text>
					<TextInput
						style={[styles.input, styles.textArea]}
						value={thoughts}
						onChangeText={setThoughts}
						placeholder="Your personal thoughts on this book..."
						multiline
						numberOfLines={4}
					/>
				</>
			)}

			{/* Non-read books show this instead of rating/thoughts */}
			{!isRead && (
				<>
					<View style={styles.sectionSpacer} />
					<View style={styles.disabledSection}>
						<Text style={styles.disabledText}>
							Rating and thoughts are available after you've read the book.
							Toggle "Already Read" to enable these sections.
						</Text>
					</View>
				</>
			)}

			<View style={styles.sectionSpacer} />

			{/* Publication Year */}
			<Text style={styles.label}>Publication Year:</Text>
			<TouchableOpacity
				style={styles.dropdownButton}
				onPress={() => setShowYearModal(true)}
			>
				<Text style={styles.dropdownButtonText}>{publicationYear}</Text>
			</TouchableOpacity>

			{/* Year selection modal */}
			<Modal
				visible={showYearModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowYearModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Publication Year</Text>

						<FlatList
							data={years}
							keyExtractor={(item) => item.toString()}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.yearItem}
									onPress={() => {
										setPublicationYear(item);
										setShowYearModal(false);
									}}
								>
									<Text
										style={[
											styles.yearText,
											publicationYear === item && styles.selectedYearText,
										]}
									>
										{item}
									</Text>
								</TouchableOpacity>
							)}
							initialScrollIndex={years.findIndex(
								(year) => year === publicationYear
							)}
							getItemLayout={(data, index) => ({
								length: 44,
								offset: 44 * index,
								index,
							})}
						/>

						<View style={styles.modalButtonRow}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowYearModal(false)}
							>
								<Text style={styles.modalButtonText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Cover Image */}
			<TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
				<Text style={styles.imagePickerText}>
					{coverImage ? "Change Cover Image" : "Pick a Cover Image"}
				</Text>
			</TouchableOpacity>

			{/* Image preview */}
			{coverImage && (
				<Image
					source={{
						uri: coverImage.isFromApi
							? coverImage.uri
							: coverImage.assets && coverImage.assets.length > 0
							? coverImage.assets[0].uri
							: coverImage.uri,
					}}
					style={styles.imagePreview}
				/>
			)}

			{/* Submit Button */}
			<Button
				title={
					editingBook
						? uploading
							? "Updating..."
							: "Update Book"
						: uploading
						? "Saving..."
						: "Save Book"
				}
				onPress={handleSubmit}
				disabled={uploading}
			/>

			<View style={styles.spacer} />

			{/* Debug info - only visible in development mode */}
			{__DEV__ && (
				<View style={styles.debugContainer}>
					<Text style={styles.debugTitle}>Debug Info</Text>
					<Text style={styles.debugText}>Server API: {API_BASE_URL}</Text>
					<Text style={styles.debugText}>Search API: {BOOK_SEARCH_API}</Text>
					<Text style={styles.debugText}>Platform: {Platform.OS}</Text>
					<Text style={styles.debugText}>
						Running on: {Platform.isDevice ? "Physical Device" : "Simulator"}
					</Text>
					<TouchableOpacity
						onPress={() =>
							Alert.alert(
								"Network Test",
								"Testing connection to: " + API_BASE_URL,
								[
									{
										text: "Test Connection",
										onPress: async () => {
											try {
												const response = await fetch(`${API_BASE_URL}/books/`);
												if (response.ok) {
													Alert.alert(
														"Success",
														"Connection to API successful!"
													);
												} else {
													Alert.alert(
														"Error",
														`Server responded with ${response.status}`
													);
												}
											} catch (error) {
												Alert.alert(
													"Connection Failed",
													"Could not connect to API.\n\n" +
														"Error: " +
														error.message
												);
											}
										},
									},
									{ text: "Cancel" },
								]
							)
						}
						style={{ paddingVertical: 5 }}
					>
						<Text style={{ color: "#007BFF", textAlign: "center" }}>
							Test API Connection
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#fff",
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
		fontWeight: "500",
	},
	input: {
		height: 40,
		borderColor: "#ccc",
		borderWidth: 1,
		marginBottom: 16,
		paddingHorizontal: 10,
		borderRadius: 4,
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
		paddingTop: 10,
	},
	sectionSpacer: {
		height: 10,
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
		paddingVertical: 6,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	imagePicker: {
		backgroundColor: "#f0f0f0",
		padding: 10,
		borderRadius: 5,
		alignItems: "center",
		marginBottom: 16,
	},
	imagePickerText: {
		color: "#007BFF",
	},
	imagePreview: {
		width: "100%",
		height: 200,
		resizeMode: "cover",
		marginBottom: 16,
		borderRadius: 8,
	},
	spacer: {
		height: 60,
	},
	// Search related styles
	searchContainer: {
		position: "relative",
		marginBottom: 16,
	},
	searchIndicator: {
		position: "absolute",
		right: 10,
		top: 10,
	},
	searchResultsContainer: {
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 4,
		backgroundColor: "#fff",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		zIndex: 999,
	},
	searchResultsTitle: {
		fontSize: 14,
		fontWeight: "500",
		padding: 8,
		backgroundColor: "#f8f8f8",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	searchResultsList: {
		maxHeight: 300,
	},
	searchResultItem: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	searchResultContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	resultThumbnail: {
		width: 40,
		height: 60,
		marginRight: 10,
	},
	noThumbnail: {
		width: 40,
		height: 60,
		marginRight: 10,
		backgroundColor: "#f0f0f0",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 4,
	},
	noThumbnailText: {
		fontSize: 10,
		color: "#999",
	},
	resultTextContainer: {
		flex: 1,
	},
	resultTitle: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 4,
	},
	resultAuthor: {
		fontSize: 14,
		color: "#666",
		marginBottom: 2,
	},
	resultYear: {
		fontSize: 12,
		color: "#888",
	},
	// Disabled section for unread books
	disabledSection: {
		backgroundColor: "#f8f8f8",
		borderRadius: 6,
		padding: 16,
		borderWidth: 1,
		borderColor: "#ddd",
		marginBottom: 16,
	},
	disabledText: {
		color: "#777",
		textAlign: "center",
		fontStyle: "italic",
	},
	dropdownButton: {
		backgroundColor: "#f0f0f0",
		padding: 12,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#ccc",
		marginBottom: 16,
	},
	dropdownButtonText: {
		color: "#333",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "80%",
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
		maxHeight: "70%",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	genreItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	genreItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	genreItemText: {
		fontSize: 16,
	},
	checkbox: {
		height: 20,
		width: 20,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#007BFF",
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		height: 12,
		width: 12,
		backgroundColor: "#007BFF",
		borderRadius: 2,
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 20,
	},
	modalButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		minWidth: 100,
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#007BFF",
	},
	modalButtonText: {
		color: "#fff",
		fontSize: 16,
	},
	ratingContainer: {
		marginBottom: 24,
	},
	ratingInputRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	ratingInput: {
		width: "30%",
		textAlign: "center",
		marginBottom: 0,
		marginHorizontal: 10,
	},
	ratingButton: {
		backgroundColor: "#007BFF",
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	ratingButtonText: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	ratingScale: {
		flexDirection: "row",
		justifyContent: "center",
		width: "100%",
		marginTop: 8,
	},
	starButton: {
		padding: 5,
		width: 48,
		alignItems: "center",
	},
	starText: {
		fontSize: 30,
	},
	starEmpty: {
		color: "#CCCCCC",
	},
	starQuarter: {
		color: "#FFE066",
	},
	starHalf: {
		color: "#FFD700",
	},
	starThreeQuarter: {
		color: "#FFBF00",
	},
	starFilled: {
		color: "#FFA500", // orange color for filled stars
	},
	ratingHelp: {
		textAlign: "center",
		fontSize: 12,
		color: "#777",
		marginTop: 8,
	},
	emojiButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
		padding: 12,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#ccc",
		marginBottom: 16,
	},
	emojiDisplay: {
		fontSize: 30,
		marginRight: 10,
	},
	emojiButtonText: {
		color: "#007BFF",
	},
	emojiOption: {
		width: "25%",
		padding: 10,
		alignItems: "center",
	},
	emojiText: {
		fontSize: 28,
		marginBottom: 4,
	},
	emojiDescription: {
		fontSize: 10,
		textAlign: "center",
		color: "#666",
	},
	yearItem: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	yearText: {
		fontSize: 16,
		textAlign: "center",
	},
	selectedYearText: {
		fontWeight: "bold",
		color: "#007BFF",
	},
	debugContainer: {
		marginTop: 20,
		padding: 10,
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	debugTitle: {
		fontWeight: "bold",
		marginBottom: 5,
	},
	debugText: {
		fontSize: 12,
		color: "#666",
		marginBottom: 3,
	},
});
