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
import { API_BASE_URL, getApiEndpoint } from "../utils/apiConfig";
import {
	syncGenresWithBackend,
	fetchGenresFromBackend,
} from "../utils/genreSync";
import HamburgerMenu from "../components/HamburgerMenu";

// OpenLibrary API for book search
const BOOK_SEARCH_API = "https://openlibrary.org/search.json";

export default function BookFormScreen({ route, navigation }) {
	// Basic book information
	const editingBook = route.params?.book;
	const [title, setTitle] = useState(editingBook ? editingBook.title : "");
	const [author, setAuthor] = useState(editingBook ? editingBook.author : "");
	const [genre, setGenre] = useState("unknown"); // Maintain for compatibility but don't actively use
	const [genres, setGenres] = useState(["unknown"]);
	const [bookNotes, setBookNotes] = useState(
		editingBook ? editingBook.book_notes : ""
	);

	// Reading status fields
	const [favorite, setFavorite] = useState(
		editingBook ? editingBook.favorite : false
	);
	const [currentlyReading, setCurrentlyReading] = useState(
		editingBook ? editingBook.currently_reading : false
	);
	const [didNotFinish, setDidNotFinish] = useState(
		editingBook ? editingBook.did_not_finish : false
	);
	const [recommendedToMe, setRecommendedToMe] = useState(
		editingBook ? editingBook.recommended_to_me : false
	);
	const [isRead, setIsRead] = useState(
		editingBook ? editingBook.is_read : false
	);
	const [toBeRead, setToBeRead] = useState(
		editingBook ? editingBook.toBeRead : false
	);
	const [shelved, setShelved] = useState(
		editingBook ? editingBook.shelved : false
	);

	// Rating fields
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

	// Additional metadata
	const [publicationYear, setPublicationYear] = useState(
		editingBook && editingBook.publication_date
			? new Date(editingBook.publication_date).getFullYear()
			: new Date().getFullYear()
	);
	const [isbn, setIsbn] = useState(editingBook ? editingBook.isbn : "");
	const [publisher, setPublisher] = useState(
		editingBook ? editingBook.publisher : ""
	);
	const [language, setLanguage] = useState(
		editingBook ? editingBook.language : ""
	);
	const [pageCount, setPageCount] = useState(
		editingBook && editingBook.page_count
			? editingBook.page_count.toString()
			: ""
	);
	const [numberOfChapters, setNumberOfChapters] = useState(
		editingBook && editingBook.number_of_chapters
			? editingBook.number_of_chapters.toString()
			: ""
	);

	// Photos
	const [myBookPhotos, setMyBookPhotos] = useState(
		editingBook ? editingBook.myBookPhotos || [] : []
	);

	// UI state
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

	// Add state for tags and content warnings
	const [tags, setTags] = useState(editingBook ? editingBook.tags : "");
	const [contentWarnings, setContentWarnings] = useState(
		editingBook ? editingBook.content_warnings : ""
	);

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
		{ label: "Young Adult", value: "young-adult" },
		{ label: "Children", value: "children" },
		{ label: "Dystopian", value: "dystopian" },
		{ label: "Utopian", value: "utopian" },
		{ label: "Supernatural", value: "supernatural" },
		{ label: "Paranormal", value: "paranormal" },
		{ label: "Graphic Novel", value: "graphic-novel" },
		{ label: "Poetry", value: "poetry" },
		{ label: "Drama", value: "drama" },
		{ label: "Classic", value: "classic" },
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

	// Genre selection logic - fixed to correctly load all genres when editing
	useEffect(() => {
		try {
			if (editingBook) {
				let initialGenres = [];

				// First, add the primary genre if it exists
				if (editingBook.genre && editingBook.genre !== "unknown") {
					initialGenres.push(editingBook.genre);
					console.log("Added primary genre:", editingBook.genre);
				}

				// Then, process additional genres if they exist
				if (editingBook.additional_genres) {
					console.log(
						"Processing additional_genres:",
						editingBook.additional_genres
					);

					// Handle case where additional_genres is a string (comma-separated)
					if (typeof editingBook.additional_genres === "string") {
						const additionalGenreArray = editingBook.additional_genres
							.split(",")
							.map((g) => g.trim())
							.filter((g) => g && g.length > 0 && g !== "unknown");

						console.log("Found additional genres:", additionalGenreArray);
						initialGenres = [...initialGenres, ...additionalGenreArray];
					}
					// Handle case where additional_genres is already an array
					else if (Array.isArray(editingBook.additional_genres)) {
						const additionalGenreArray = editingBook.additional_genres.filter(
							(g) => g && g !== "unknown"
						);

						initialGenres = [...initialGenres, ...additionalGenreArray];
					}
				}

				// Remove duplicates
				initialGenres = [...new Set(initialGenres)];

				// Use valid genres or fall back to "unknown"
				setGenres(initialGenres.length > 0 ? initialGenres : ["unknown"]);
				console.log(
					"Initial genres set to:",
					initialGenres.length > 0 ? initialGenres : ["unknown"]
				);
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

	// Modify the existing useEffect for navigation options
	useEffect(() => {
		// Replace home button with hamburger menu and keep favorite star button
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			headerRight: () => (
				<TouchableOpacity
					style={styles.favoriteButton}
					onPress={() => setFavorite(!favorite)}
				>
					<Text style={styles.favoriteButtonText}>{favorite ? "⭐" : "☆"}</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, favorite]);

	// Sync genres when the component mounts
	useEffect(() => {
		// Try to sync genres when the component mounts, but don't block on failure
		syncGenresWithBackend(GENRE_CHOICES)
			.then((result) => {
				if (result) {
					console.log("Genre synchronization completed successfully");
				} else {
					console.log("Genre synchronization skipped or failed");
				}
			})
			.catch((error) => {
				// Just log the error, don't disrupt the app flow
				console.error("Genre sync error:", error);
			});
	}, []);

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
				const url = `${BOOK_SEARCH_API}?q=${encodedQuery}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,description,subject,first_sentence,publisher,isbn,language,number_of_pages,oclc,lccn`;

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
								isbn: book.isbn || [],
								publisher: book.publisher || [],
								language: book.language || [],
								number_of_pages: book.number_of_pages,
								oclc: book.oclc || [],
								lccn: book.lccn || [],
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

	// Function to analyze text and extract tags
	const extractTagsFromText = (text, subjects = []) => {
		if (!text) return [];

		// Common literary themes, settings, character types, and concepts to look for
		const themeKeywords = [
			// Themes
			{ word: "love", tag: "romance" },
			{ word: "death", tag: "mortality" },
			{ word: "war", tag: "conflict" },
			{ word: "family", tag: "family" },
			{ word: "friendship", tag: "friendship" },
			{ word: "betrayal", tag: "revenge" },
			{ word: "revenge", tag: "revenge" },
			{ word: "journey", tag: "journey" },
			{ word: "quest", tag: "quest" },
			{ word: "adventure", tag: "adventure" },
			{ word: "coming of age", tag: "coming-of-age" },
			{ word: "identity", tag: "identity" },
			{ word: "power", tag: "power" },
			{ word: "struggle", tag: "struggle" },
			{ word: "survival", tag: "survival" },
			{ word: "rebellion", tag: "rebellion" },
			{ word: "dystopia", tag: "dystopian" },
			{ word: "utopia", tag: "utopian" },
			{ word: "magic", tag: "magical" },

			// Settings
			{ word: "forest", tag: "forest" },
			{ word: "castle", tag: "castle" },
			{ word: "space", tag: "space" },
			{ word: "future", tag: "futuristic" },
			{ word: "medieval", tag: "medieval" },
			{ word: "ancient", tag: "ancient" },
			{ word: "modern", tag: "modern" },
			{ word: "urban", tag: "urban" },
			{ word: "rural", tag: "rural" },
			{ word: "island", tag: "island" },
			{ word: "mountain", tag: "mountains" },
			{ word: "desert", tag: "desert" },
			{ word: "sea", tag: "sea" },
			{ word: "ocean", tag: "ocean" },
			{ word: "school", tag: "school" },
			{ word: "college", tag: "academic" },
			{ word: "university", tag: "academic" },

			// Creatures & Character Types
			{ word: "dragon", tag: "dragons" },
			{ word: "vampire", tag: "vampires" },
			{ word: "werewolf", tag: "werewolves" },
			{ word: "witch", tag: "witches" },
			{ word: "wizard", tag: "wizards" },
			{ word: "ghost", tag: "ghosts" },
			{ word: "demon", tag: "demons" },
			{ word: "angel", tag: "angels" },
			{ word: "alien", tag: "aliens" },
			{ word: "robot", tag: "robots" },
			{ word: "android", tag: "androids" },
			{ word: "warrior", tag: "warriors" },
			{ word: "knight", tag: "knights" },
			{ word: "princess", tag: "royalty" },
			{ word: "prince", tag: "royalty" },
			{ word: "king", tag: "royalty" },
			{ word: "queen", tag: "royalty" },
			{ word: "detective", tag: "detectives" },

			// Time Periods
			{ word: "historical", tag: "historical" },
			{ word: "victorian", tag: "victorian" },
			{ word: "regency", tag: "regency" },
			{ word: "world war", tag: "world-war" },
			{ word: "1920", tag: "1920s" },
			{ word: "1930", tag: "1930s" },
			{ word: "1940", tag: "1940s" },
			{ word: "1950", tag: "1950s" },
			{ word: "1960", tag: "1960s" },
			{ word: "1970", tag: "1970s" },
			{ word: "1980", tag: "1980s" },
			{ word: "1990", tag: "1990s" },

			// Story Elements
			{ word: "mystery", tag: "mystery" },
			{ word: "thriller", tag: "thriller" },
			{ word: "suspense", tag: "suspense" },
			{ word: "horror", tag: "horror" },
			{ word: "comedy", tag: "comedy" },
			{ word: "humorous", tag: "humor" },
			{ word: "tragic", tag: "tragedy" },
			{ word: "crime", tag: "crime" },
			{ word: "murder", tag: "murder" },
			{ word: "political", tag: "politics" },
			{ word: "conspiracy", tag: "conspiracy" },
			{ word: "espionage", tag: "espionage" },
			{ word: "psychological", tag: "psychological" },
			{ word: "philosophical", tag: "philosophical" },
			{ word: "religion", tag: "religion" },
			{ word: "mythology", tag: "mythology" },
			{ word: "legend", tag: "legends" },

			// LGBTQ+ related keywords
			{ word: "gay", tag: "LGBTQ+" },
			{ word: "lesbian", tag: "LGBTQ+" },
			{ word: "bisexual", tag: "LGBTQ+" },
			{ word: "transgender", tag: "LGBTQ+" },
			{ word: "trans ", tag: "LGBTQ+" },
			{ word: "queer", tag: "LGBTQ+" },
			{ word: "non-binary", tag: "LGBTQ+" },
			{ word: "nonbinary", tag: "LGBTQ+" },
			{ word: "genderfluid", tag: "LGBTQ+" },
			{ word: "same-sex", tag: "LGBTQ+" },
			{ word: "lgbt", tag: "LGBTQ+" },
		];

		// Initialize tags array
		let tags = [];

		// Add tags from subject categories if available
		if (subjects && subjects.length > 0) {
			// Common subject categories that make good tags
			const goodSubjectTags = [
				"fiction",
				"non-fiction",
				"fantasy",
				"science fiction",
				"mystery",
				"romance",
				"thriller",
				"horror",
				"adventure",
				"historical",
				"biography",
				"young adult",
				"children",
				"dystopian",
				"utopian",
				"supernatural",
				"paranormal",
			];

			subjects.forEach((subject) => {
				const lowerSubject = subject.toLowerCase();

				// Check if the subject is a good tag candidate
				for (const goodTag of goodSubjectTags) {
					if (lowerSubject.includes(goodTag)) {
						// Format multi-word tags with hyphens
						tags.push(goodTag.replace(/\s+/g, "-"));
						break;
					}
				}
			});
		}

		// Look for theme keywords in the text
		const lowerText = text.toLowerCase();
		themeKeywords.forEach(({ word, tag }) => {
			if (lowerText.includes(word)) {
				tags.push(tag);
			}
		});

		// Remove duplicates
		tags = [...new Set(tags)];

		// Limit to top 5 tags maximum
		return tags.slice(0, 5);
	};

	// Function to detect content warnings from text
	const extractContentWarnings = (text, subjects = []) => {
		if (!text) return [];

		// Common content warning categories
		const contentWarningKeywords = [
			// Violence
			{ word: "violence", warning: "violence" },
			{ word: "violent", warning: "violence" },
			{ word: "gore", warning: "graphic violence" },
			{ word: "blood", warning: "blood" },
			{ word: "murder", warning: "murder" },
			{ word: "war", warning: "war" },
			{ word: "torture", warning: "torture" },

			// Abuse
			{ word: "abuse", warning: "abuse" },
			{ word: "domestic abuse", warning: "domestic abuse" },
			{ word: "child abuse", warning: "child abuse" },
			{ word: "sexual abuse", warning: "sexual abuse" },
			{ word: "assault", warning: "assault" },

			// Sexual content
			{ word: "sexual content", warning: "sexual content" },
			{ word: "sexual assault", warning: "sexual assault" },
			{ word: "rape", warning: "sexual assault" },

			// Self-harm and suicide
			{ word: "suicide", warning: "suicide" },
			{ word: "self-harm", warning: "self-harm" },
			{ word: "self harm", warning: "self-harm" },

			// Mental health
			{ word: "depression", warning: "depression" },
			{ word: "anxiety", warning: "anxiety" },
			{ word: "eating disorder", warning: "eating disorders" },
			{ word: "addiction", warning: "addiction" },

			// Phobias and triggers
			{ word: "phobia", warning: "phobias" },
			{ word: "arachnophobia", warning: "spiders" },
			{ word: "claustrophobia", warning: "confined spaces" },

			// Discrimination
			{ word: "racism", warning: "racism" },
			{ word: "homophobia", warning: "homophobia" },
			{ word: "transphobia", warning: "transphobia" },
			{ word: "sexism", warning: "sexism" },
			{ word: "antisemitism", warning: "antisemitism" },
			{ word: "islamophobia", warning: "islamophobia" },

			// Death and grief
			{ word: "death", warning: "death" },
			{ word: "grief", warning: "grief" },
			{ word: "terminal illness", warning: "terminal illness" },
			{ word: "cancer", warning: "cancer" },

			// Others
			{ word: "drug", warning: "drug use" },
			{ word: "alcohol", warning: "alcohol abuse" },
			{ word: "alcoholism", warning: "alcohol abuse" },
			{ word: "animal cruelty", warning: "animal cruelty" },
			{ word: "animal death", warning: "animal death" },
			{ word: "incest", warning: "incest" },
			{ word: "abortion", warning: "abortion" },
			{ word: "miscarriage", warning: "pregnancy loss" },
			{ word: "stillbirth", warning: "pregnancy loss" },
		];

		// Initialize warnings array
		let warnings = [];

		// Add warnings from subject categories if available
		if (subjects && subjects.length > 0) {
			subjects.forEach((subject) => {
				const lowerSubject = subject.toLowerCase();
				contentWarningKeywords.forEach(({ word, warning }) => {
					if (lowerSubject.includes(word)) {
						warnings.push(warning);
					}
				});
			});
		}

		// Look for warning keywords in the text
		const lowerText = text.toLowerCase();
		contentWarningKeywords.forEach(({ word, warning }) => {
			if (lowerText.includes(word)) {
				warnings.push(warning);
			}
		});

		// Remove duplicates and capitalize first letter of each warning
		warnings = [...new Set(warnings)].map(
			(warning) => warning.charAt(0).toUpperCase() + warning.slice(1)
		);

		return warnings;
	};

	// Enhanced function to fetch book details after selection
	const fetchBookDetails = async (olKey) => {
		if (!olKey) return null;

		try {
			console.log("Fetching detailed book info from OpenLibrary:", olKey);
			const workUrl = `https://openlibrary.org${olKey}.json`;
			const response = await fetch(workUrl);

			if (!response.ok) {
				console.log("Error fetching book details:", response.status);
				return null;
			}

			const data = await response.json();
			console.log(
				"Received book details:",
				JSON.stringify(data).substring(0, 200) + "..."
			);

			// IMPROVED: Extract original language information if available in the work data
			if (data.original_languages && data.original_languages.length > 0) {
				// This is the most reliable source for original publishing language
				const langKey = data.original_languages[0];
				console.log("Found original language key in work data:", langKey);

				// Extract language code from key (e.g., /languages/eng -> eng)
				const langCode = langKey.split("/").pop();
				data.original_language_code = langCode;
			} else if (data.languages && data.languages.length > 0) {
				// If no original_languages, use the first language listed
				const langKey = data.languages[0];
				console.log("Found language key in work data:", langKey);

				// Extract language code from key
				const langCode =
					typeof langKey === "string" ? langKey.split("/").pop() : langKey;
				data.original_language_code = langCode;
			}

			// IMPROVED: Check multiple potential sources for chapter count
			if (data.number_of_chapters) {
				console.log(
					"Found explicit number of chapters:",
					data.number_of_chapters
				);
			} else if (
				data.table_of_contents &&
				Array.isArray(data.table_of_contents)
			) {
				// Count chapters from table of contents
				const chapters = data.table_of_contents.filter(
					(item) =>
						(item.title && item.title.toLowerCase().includes("chapter")) ||
						(item.type && item.type === "chapter")
				);

				if (chapters.length > 0) {
					console.log(
						"Estimated number of chapters from TOC:",
						chapters.length
					);
					data.number_of_chapters = chapters.length;
				}
			} else if (data.excerpts && data.excerpts.length > 0) {
				// Sometimes excerpt text mentions "N chapters"
				for (const excerpt of data.excerpts) {
					if (excerpt.text) {
						const chapterMatch = excerpt.text.match(/(\d+)\s+chapters/i);
						if (chapterMatch && chapterMatch[1]) {
							console.log("Found chapter count in excerpt:", chapterMatch[1]);
							data.number_of_chapters = parseInt(chapterMatch[1]);
							break;
						}
					}
				}
			}

			return data;
		} catch (error) {
			console.log("Error in fetchBookDetails:", error);
			return null;
		}
	};

	// Enhanced function to fetch edition details
	const fetchEditionDetails = async (isbn) => {
		if (!isbn) return null;

		try {
			console.log("Fetching edition details for ISBN:", isbn);
			// IMPROVED: Use jscmd=details for more comprehensive metadata
			const editionUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`;
			const response = await fetch(editionUrl);

			if (!response.ok) {
				console.log("Error fetching edition details:", response.status);
				return null;
			}

			const data = await response.json();
			const editionData = data[`ISBN:${isbn}`];
			console.log(
				"Received edition details:",
				editionData ? "Found" : "Not found"
			);

			// IMPROVED: Try to extract additional data from edition details
			if (editionData && editionData.details) {
				// Look for chapter count in the details if available
				if (
					editionData.details.table_of_contents &&
					Array.isArray(editionData.details.table_of_contents)
				) {
					const chapters = editionData.details.table_of_contents.filter(
						(item) =>
							(item.title && item.title.toLowerCase().includes("chapter")) ||
							(item.type && item.type === "chapter")
					);

					if (chapters.length > 0) {
						console.log("Found chapters in edition details:", chapters.length);
						editionData.number_of_chapters = chapters.length;
					}
				}

				// ENHANCED: Improved language extraction with focus on original language
				if (
					editionData.details.languages &&
					Array.isArray(editionData.details.languages)
				) {
					// More comprehensive language code mapping
					const langMap = {
						eng: "English",
						spa: "Spanish",
						fre: "French",
						ger: "German",
						ita: "Italian",
						rus: "Russian",
						chi: "Chinese",
						jpn: "Japanese",
						ara: "Arabic",
						hin: "Hindi",
						por: "Portuguese",
						ben: "Bengali",
						tur: "Turkish",
						kor: "Korean",
						swe: "Swedish",
						nor: "Norwegian",
						dan: "Danish",
						fin: "Finnish",
						dut: "Dutch",
						pol: "Polish",
						gre: "Greek",
						lat: "Latin",
						heb: "Hebrew",
						hun: "Hungarian",
						cze: "Czech",
						san: "Sanskrit",
						ukr: "Ukrainian",
						vie: "Vietnamese",
						tha: "Thai",
						may: "Malay",
					};

					// First look for language marked as original
					let originalLanguage = null;
					for (const lang of editionData.details.languages) {
						if (
							lang.original === true ||
							(lang.key && lang.key.includes("/original/")) ||
							lang.role === "original"
						) {
							const langCode =
								typeof lang.key === "string"
									? lang.key.split("/").pop()
									: lang.key;
							originalLanguage = langMap[langCode] || lang.name || langCode;
							console.log(
								"Found original language in edition data:",
								originalLanguage
							);
							break;
						}
					}

					// If no original language is marked, use the first language
					if (!originalLanguage) {
						const firstLang = editionData.details.languages[0];
						const langCode =
							typeof firstLang.key === "string"
								? firstLang.key.split("/").pop()
								: firstLang.key;
						originalLanguage = langMap[langCode] || firstLang.name || langCode;
						console.log(
							"Using first language as probable original language:",
							originalLanguage
						);
					}

					editionData.original_language = originalLanguage;
				}
			}

			return editionData;
		} catch (error) {
			console.log("Error in fetchEditionDetails:", error);
			return null;
		}
	};

	// Greatly enhanced selectBook function to populate all available metadata
	const selectBook = async (book) => {
		// Populate basic fields first
		setTitle(book.title);
		setAuthor(book.author);

		if (book.publishedYear) {
			setPublicationYear(book.publishedYear);
		}

		// ENHANCED: Fetch more detailed information from the OpenLibrary Work API
		let detailedBookData = null;
		if (book.key) {
			detailedBookData = await fetchBookDetails(book.key);

			// Set number of chapters if available from work data
			if (detailedBookData && detailedBookData.number_of_chapters) {
				setNumberOfChapters(detailedBookData.number_of_chapters.toString());
				console.log(
					"Setting number of chapters from work data:",
					detailedBookData.number_of_chapters
				);
			}
		}

		// ENHANCED: Extract ISBN with improved validation
		let foundIsbn = null;
		if (book.isbn && book.isbn.length > 0) {
			// Prefer ISBN-13 over ISBN-10
			const isbn13 = book.isbn.find((i) => i && i.length === 13);
			const isbn10 = book.isbn.find((i) => i && i.length === 10);
			foundIsbn = isbn13 || isbn10 || book.isbn[0];

			// Validate ISBN format (remove hyphens, spaces, etc.)
			if (foundIsbn) {
				foundIsbn = foundIsbn.replace(/[^0-9X]/gi, "");
				setIsbn(foundIsbn);
				console.log("Found and cleaned ISBN:", foundIsbn);
			}
		}

		// ENHANCED: Fetch detailed edition information if ISBN is available
		let editionData = null;
		if (foundIsbn) {
			editionData = await fetchEditionDetails(foundIsbn);
		}

		// ENHANCED: Extract and set publisher information with better validation
		if (
			editionData &&
			editionData.publishers &&
			editionData.publishers.length > 0
		) {
			const publisherName =
				typeof editionData.publishers[0] === "object"
					? editionData.publishers[0].name
					: editionData.publishers[0];

			setPublisher(publisherName || "");
			console.log("Setting publisher:", publisherName);
		} else if (book.publisher && book.publisher.length > 0) {
			const publisherName =
				typeof book.publisher[0] === "object"
					? book.publisher[0].name
					: book.publisher[0];

			setPublisher(publisherName || "");
			console.log("Setting publisher from search results:", publisherName);
		}

		// ENHANCED: Extract and set language with more robust handling
		if (
			editionData &&
			editionData.languages &&
			editionData.languages.length > 0
		) {
			let langName;

			// Handle different formats of language data
			if (typeof editionData.languages[0] === "object") {
				langName = editionData.languages[0].name || "English";
			} else {
				langName = editionData.languages[0] || "English";
			}

			setLanguage(langName);
			console.log("Setting language:", langName);
		} else if (book.language && book.language.length > 0) {
			// Fallback to search results language if available
			let langName;

			if (typeof book.language[0] === "object") {
				langName = book.language[0].name || "English";
			} else {
				langName = book.language[0] || "English";
			}

			setLanguage(langName);
			console.log("Setting language from search results:", langName);
		}

		// ENHANCED: Extract and set page count with better validation
		if (editionData && editionData.number_of_pages) {
			const pages = parseInt(editionData.number_of_pages);
			if (!isNaN(pages) && pages > 0) {
				setPageCount(pages.toString());
				console.log("Setting page count:", pages);
			}
		} else if (editionData && editionData.pagination) {
			// Try to extract from pagination string (e.g., "xii, 223 p.")
			const pagesMatch = editionData.pagination.match(/(\d+)\s*p/);
			if (pagesMatch && pagesMatch[1]) {
				setPageCount(pagesMatch[1]);
				console.log("Setting page count from pagination:", pagesMatch[1]);
			}
		} else if (book.number_of_pages) {
			const pages = parseInt(book.number_of_pages);
			if (!isNaN(pages) && pages > 0) {
				setPageCount(pages.toString());
				console.log("Setting page count from search results:", pages);
			}
		} else if (book.pagination) {
			// Try search results pagination as last resort
			const pagesMatch = book.pagination.match(/(\d+)\s*p/);
			if (pagesMatch && pagesMatch[1]) {
				setPageCount(pagesMatch[1]);
				console.log(
					"Setting page count from search pagination:",
					pagesMatch[1]
				);
			}
		}

		// ENHANCED: Set number of chapters from edition data if not already set
		if (!numberOfChapters && editionData && editionData.number_of_chapters) {
			setNumberOfChapters(editionData.number_of_chapters.toString());
			console.log(
				"Setting number of chapters from edition:",
				editionData.number_of_chapters
			);
		} else if (
			!numberOfChapters &&
			editionData &&
			editionData.table_of_contents
		) {
			// Try to estimate from table of contents
			const chapters = editionData.table_of_contents.filter(
				(item) =>
					(item.title && item.title.toLowerCase().includes("chapter")) ||
					(item.type && item.type === "chapter")
			);
			if (chapters.length > 0) {
				setNumberOfChapters(chapters.length.toString());
				console.log("Estimated number of chapters from TOC:", chapters.length);
			}
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
		else if (book.firstSentence) {
			// Ensure firstSentence is a string before calling trim
			const firstSentenceText =
				typeof book.firstSentence === "string"
					? book.firstSentence.trim()
					: Array.isArray(book.firstSentence)
					? book.firstSentence[0]
					: String(book.firstSentence);

			vibesText += '\n\nOpening line: "' + firstSentenceText + '"';
		}

		// Set the vibes text (including both metadata and synopsis if available)
		setVibes(vibesText);

		// Generate tags automatically based on book description and subjects
		const generatedTags = extractTagsFromText(vibesText, book.subject);
		console.log("Generated tags:", generatedTags);

		// Store the generated tags
		const tagsString = generatedTags.join(", ");
		setTags(tagsString);

		// Generate content warnings based on book description and subjects
		const generatedWarnings = extractContentWarnings(vibesText, book.subject);
		console.log("Generated content warnings:", generatedWarnings);

		// Store the generated content warnings
		const warningsString = generatedWarnings.join(", ");
		setContentWarnings(warningsString);

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

		// SIMPLIFIED: No longer setting cover image from API results
		// This forces users to select their own images

		// Hide search results
		setShowSearchResults(false);
	};

	const pickImages = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsMultipleSelection: true,
				selectionLimit: 5, // Limit to 5 photos
				quality: 1,
			});

			if (!result.canceled) {
				// Get the new assets
				const newPhotos = result.assets.map((asset) => ({
					uri: asset.uri,
					name: asset.fileName || `photo-${Date.now()}.jpg`,
					type: "image/jpeg",
				}));

				// Check if adding these would exceed our limit of 5
				if (myBookPhotos.length + newPhotos.length > 5) {
					Alert.alert(
						"Too Many Photos",
						`You can only upload up to 5 photos. You already have ${myBookPhotos.length}.`
					);
					return;
				}

				// Add to existing photos
				setMyBookPhotos([...myBookPhotos, ...newPhotos]);
			}
		} catch (error) {
			console.error("Error picking images:", error);
			Alert.alert("Error picking images. Please try again.");
		}
	};

	// Remove a photo from the collection
	const removePhoto = (index) => {
		const updatedPhotos = [...myBookPhotos];
		updatedPhotos.splice(index, 1);
		setMyBookPhotos(updatedPhotos);
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

	// UPDATED: Handle the form submission with improved URL handling
	const handleSubmit = async () => {
		if (!title || !author) {
			Alert.alert("Title and author are required fields.");
			return;
		}

		setUploading(true);
		try {
			console.log("Creating form data...");
			let formData = new FormData();

			// Add all the basic book information
			formData.append("title", title);
			formData.append("author", author);

			// Add the metadata fields with improved validation
			if (isbn && isbn.trim()) formData.append("isbn", isbn.trim());

			if (publisher && publisher.trim())
				formData.append("publisher", publisher.trim());

			if (language && language.trim())
				formData.append("language", language.trim());

			if (pageCount && !isNaN(parseInt(pageCount))) {
				formData.append("page_count", pageCount.toString());
			}

			// Add number of chapters to form data
			if (numberOfChapters && !isNaN(parseInt(numberOfChapters))) {
				formData.append("number_of_chapters", numberOfChapters.toString());
				console.log("Adding number_of_chapters to form:", numberOfChapters);
			}

			// FIXED: Only send the first genre to match backend model expectations
			if (genres && genres.length > 0) {
				formData.append("genre", genres[0]); // Send only the first/primary genre
				console.log("Sending primary genre:", genres[0]);

				// Store all additional genres in a separate field
				if (genres.length > 1) {
					formData.append("additional_genres", genres.slice(1).join(","));
					console.log("Additional genres:", genres.slice(1).join(","));
				}
			} else {
				formData.append("genre", "unknown");
			}

			// Format the book notes with improved handling
			let combinedNotes = "";
			if (vibes && thoughts) {
				combinedNotes = `${vibes}--VIBES_SEPARATOR--${thoughts}`;
			} else if (vibes) {
				combinedNotes = vibes;
			} else {
				combinedNotes = thoughts || "";
			}
			formData.append("book_notes", combinedNotes);

			// Ensure rating is properly formatted and valid
			const ratingValue = parseFloat(rating);
			if (!isNaN(ratingValue)) {
				formData.append("rating", ratingValue.toFixed(2));
			} else {
				formData.append("rating", "0.00");
			}

			// Add boolean values - convert to string format expected by Django
			formData.append("is_read", isRead ? "true" : "false");
			formData.append("toBeRead", toBeRead ? "true" : "false");
			formData.append("shelved", shelved ? "true" : "false");
			formData.append("currently_reading", currentlyReading ? "true" : "false");
			formData.append("did_not_finish", didNotFinish ? "true" : "false");
			formData.append("recommended_to_me", recommendedToMe ? "true" : "false");
			formData.append("favorite", favorite ? "true" : "false");

			// Format date as YYYY-MM-DD for Django
			const dateObj = new Date(publicationYear, 0, 1);
			const formattedDate = dateObj.toISOString().split("T")[0];
			formData.append("publication_date", formattedDate);

			// Add tags and warnings with proper validation
			if (tags) {
				formData.append("tags", tags.substring(0, 255));
			}

			if (contentWarnings) {
				formData.append("content_warnings", contentWarnings);
			}

			formData.append("emoji", emoji || "📚");

			// Add each photo to the form data with improved debugging
			myBookPhotos.forEach((photo, index) => {
				console.log(`Adding photo ${index}:`, photo.uri);

				// Ensure we're providing a proper file name with extension
				const fileName = photo.name || `photo-${Date.now()}-${index}.jpg`;
				console.log(`Using filename: ${fileName}`);

				// Create a proper photo object
				const photoObj = {
					uri: photo.uri,
					type: "image/jpeg",
					name: fileName,
				};

				console.log(`Photo object:`, JSON.stringify(photoObj));
				formData.append(`book_photo_${index}`, photoObj);
			});

			// Add the count of photos for easier processing on server
			formData.append("book_photo_count", myBookPhotos.length.toString());
			console.log(`Added ${myBookPhotos.length} photos to form data`);

			// When editing and replacing photos, let the server know
			if (editingBook && myBookPhotos.length > 0) {
				formData.append("replace_photos", "true");
			}

			// Determine the API endpoint with improved error handling
			let url;
			try {
				if (editingBook) {
					url = getApiEndpoint(`books/${editingBook.id}/`);
				} else {
					url = getApiEndpoint("books/");
				}
				console.log("Using API URL:", url);
			} catch (error) {
				console.error("Error constructing API URL:", error);
				// Fallback to a safe default if getApiEndpoint fails
				const baseUrl = "http://localhost:8000/api";
				url = editingBook
					? `${baseUrl}/books/${editingBook.id}/`
					: `${baseUrl}/books/`;
			}

			// Ensure URL has trailing slash for Django compatibility
			if (!url.endsWith("/")) {
				url += "/";
			}

			console.log(`Submitting to ${editingBook ? "PUT" : "POST"} ${url}`);

			// Debug the form data
			console.log("Form data entries:");
			for (let [key, value] of formData._parts) {
				if (typeof value === "object" && !Array.isArray(value)) {
					console.log(`${key}: [Complex Object]`);
				} else {
					console.log(`${key}: ${value}`);
				}
			}

			// IMPROVED: Submit with explicit content type
			const response = await fetch(url, {
				method: editingBook ? "PUT" : "POST",
				body: formData,
				headers: {
					Accept: "application/json",
					// Don't explicitly set Content-Type when using FormData
					// React Native will set it with proper boundary
				},
			});

			console.log("Response status:", response.status);

			// Enhanced error handling
			if (response.ok) {
				const data = await response.json();
				console.log("Book saved successfully:", data);
				Alert.alert("Success", "Book saved successfully!");
				navigation.navigate("BookListScreen", { refresh: Date.now() });
			} else {
				// More detailed error handling
				let errorText = "";
				let errorDetails = {};

				// Try to get JSON error first
				try {
					errorDetails = await response.json();
					errorText = JSON.stringify(errorDetails);
					console.error("Server returned error:", errorDetails);
				} catch (e) {
					// If not JSON, get text
					try {
						errorText = await response.text();
						console.error("Server returned text error:", errorText);
					} catch (e2) {
						errorText = "Unknown error";
					}
				}

				// Create a more informative error message
				let errorMessage = `Server error (${response.status})`;

				// If we have field-specific errors, display them
				if (errorDetails && typeof errorDetails === "object") {
					const fieldErrors = Object.entries(errorDetails)
						.map(
							([field, errors]) =>
								`${field}: ${
									Array.isArray(errors) ? errors.join(", ") : errors
								}`
						)
						.join("\n");

					if (fieldErrors) {
						errorMessage += `\n\nField errors:\n${fieldErrors}`;
					}
				} else if (errorText) {
					errorMessage += `\n\n${errorText}`;
				}

				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error("Error saving book:", error);
			Alert.alert(
				"Error Saving Book",
				`There was a problem saving the book:\n\n${error.message}`
			);
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

			{/* Tags field (auto-generated) */}
			<Text style={styles.label}>Tags (Auto-Generated):</Text>
			<TextInput
				style={styles.input}
				value={tags}
				onChangeText={setTags}
				placeholder="Comma-separated tags"
			/>

			{/* Content Warnings field (auto-generated) */}
			<Text style={styles.label}>Content Warnings:</Text>
			<TextInput
				style={styles.input}
				value={contentWarnings}
				onChangeText={setContentWarnings}
				placeholder="Comma-separated content warnings"
			/>

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

			{/* New status toggles */}
			<View style={styles.switchContainer}>
				<Text style={styles.label}>Currently Reading:</Text>
				<Switch
					value={currentlyReading}
					onValueChange={setCurrentlyReading}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={currentlyReading ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			<View style={styles.switchContainer}>
				<Text style={styles.label}>Did Not Finish:</Text>
				<Switch
					value={didNotFinish}
					onValueChange={setDidNotFinish}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={didNotFinish ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			<View style={styles.switchContainer}>
				<Text style={styles.label}>Recommended To Me:</Text>
				<Switch
					value={recommendedToMe}
					onValueChange={setRecommendedToMe}
					trackColor={{ false: "#767577", true: "#81b0ff" }}
					thumbColor={recommendedToMe ? "#f5dd4b" : "#f4f3f4"}
				/>
			</View>

			{/* Favorite toggle */}
			<View style={styles.switchContainer}>
				<Text style={styles.label}>Favorite:</Text>
				<Switch
					value={favorite}
					onValueChange={setFavorite}
					trackColor={{ false: "#767577", true: "#ffb900" }}
					thumbColor={favorite ? "#f5dd4b" : "#f4f3f4"}
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

			{/* Me and My Books section */}
			<View style={styles.sectionSpacer} />
			<Text style={styles.sectionTitle}>Me and My Books</Text>
			<Text style={styles.photoInstructions}>
				Upload 1-5 photos of you with this book, your reading spot, or your
				personalized bookshelf.
			</Text>

			{/* Photos gallery */}
			{myBookPhotos.length > 0 && (
				<View style={styles.photoGallery}>
					{myBookPhotos.map((photo, index) => (
						<View key={index} style={styles.photoContainer}>
							<Image
								source={{ uri: photo.uri }}
								style={styles.thumbnailImage}
							/>
							<TouchableOpacity
								style={styles.removePhotoButton}
								onPress={() => removePhoto(index)}
							>
								<Text style={styles.removePhotoButtonText}>×</Text>
							</TouchableOpacity>
						</View>
					))}
				</View>
			)}

			{/* Add photos button - disable if 5 photos already */}
			<TouchableOpacity
				onPress={pickImages}
				style={[
					styles.imagePicker,
					myBookPhotos.length >= 5 && styles.disabledButton,
				]}
				disabled={myBookPhotos.length >= 5}
			>
				<Text style={styles.imagePickerText}>
					{myBookPhotos.length === 0
						? "Add Photos (Up to 5)"
						: myBookPhotos.length >= 5
						? "Maximum Photos Added"
						: `Add More Photos (${5 - myBookPhotos.length} remaining)`}
				</Text>
			</TouchableOpacity>

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
	},
	genreItem: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
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
		width: 20,
		height: 20,
		borderWidth: 1,
		borderColor: "#007BFF",
		borderRadius: 4,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		width: 14,
		height: 14,
		backgroundColor: "#007BFF",
		borderRadius: 3,
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 10,
	},
	modalButton: {
		backgroundColor: "#007BFF",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 4,
	},
	cancelButton: {
		backgroundColor: "#f44336",
		marginLeft: 10,
	},
	modalButtonText: {
		color: "#fff",
		fontWeight: "500",
	},
	ratingContainer: {
		backgroundColor: "#f9f9f9",
		padding: 15,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		marginBottom: 20,
	},
	ratingInputRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	ratingButton: {
		backgroundColor: "#007BFF",
		padding: 10,
		borderRadius: 4,
		width: 40,
		alignItems: "center",
	},
	ratingButtonText: {
		color: "#fff",
		fontWeight: "500",
	},
	ratingScale: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	starButton: {
		padding: 0,
	},
	starText: {
		fontSize: 24,
	},

	starFilled: {
		color: "#FFD700",
	},
	starQuarter: {
		color: "#FFD700",
	},
	starHalf: {
		color: "#FFD700",
	},
	starThreeQuarter: {
		color: "#FFD700",
	},
	starEmpty: {
		color: "#ddd",
	},
	ratingHelp: {
		fontSize: 12,
		color: "#666",
		textAlign: "center",
	},
	emojiButton: {
		backgroundColor: "#007BFF",
		padding: 10,
		borderRadius: 4,
		alignItems: "center",
		marginBottom: 20,
	},
	emojiDisplay: {
		fontSize: 32,
	},
	emojiOption: {
		flex: 1,
		alignItems: "center",
		padding: 10,
	},
	emojiText: {
		fontSize: 28,
	},
	emojiDescription: {
		fontSize: 12,
		color: "#666",
		textAlign: "center",
	},
	debugContainer: {
		backgroundColor: "#f0f0f0",
		padding: 15,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		marginTop: 20,
	},
	debugTitle: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 10,
	},
	debugText: {
		fontSize: 14,
		color: "#333",
	},
	homeButton: {
		padding: 10,
	},
	homeButtonText: {
		fontSize: 20,
	},
	// Add styles for the favorite button
	favoriteButton: {
		padding: 10,
		marginRight: 5,
	},
	favoriteButtonText: {
		fontSize: 24,
	},
	// New styles for the photo gallery
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
		color: "#333",
	},
	photoInstructions: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
		fontStyle: "italic",
	},
	photoGallery: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 16,
	},
	photoContainer: {
		width: "31%",
		aspectRatio: 1,
		margin: "1%",
		position: "relative",
	},
	thumbnailImage: {
		width: "100%",
		height: "100%",
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	removePhotoButton: {
		position: "absolute",
		top: -8,
		right: -8,
		backgroundColor: "#ff4d4d",
		width: 22,
		height: 22,
		borderRadius: 11,
		justifyContent: "center",
		alignItems: "center",
	},
	removePhotoButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		lineHeight: 20,
	},
	disabledButton: {
		backgroundColor: "#f0f0f0",
		opacity: 0.7,
	},
});
