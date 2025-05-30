import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
	ScrollView,
	ActivityIndicator,
	Alert,
	SafeAreaView,
	Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // Fix: proper import for useFocusEffect
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiEndpoint } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

export default function WelcomeScreen({ navigation }) {
	// Add state for menu visibility
	const [menuVisible, setMenuVisible] = useState(false);
	// Add state for reading days counter
	const [totalDaysRead, setTotalDaysRead] = useState(0);
	const [hasReadToday, setHasReadToday] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Add state for Book of the Day with proper error boundaries
	const [bookOfTheDay, setBookOfTheDay] = useState(null);
	const [bookOfTheDayLoading, setBookOfTheDayLoading] = useState(false);
	const [bookOfTheDayError, setBookOfTheDayError] = useState(null);
	const [bookWidgetVisible, setBookWidgetVisible] = useState(true); // Toggle to disable feature if it fails

	// Toggle menu visibility
	const toggleMenu = () => {
		setMenuVisible(!menuVisible);
	};

	// Navigation handler with error handling for screens that don't exist yet
	const navigateToScreen = (screenName) => {
		try {
			// List of screens that actually exist in the app
			const existingScreens = [
				"BookListScreen",
				"BookFormScreen",
				"BookDetailScreen",
			];

			if (existingScreens.includes(screenName)) {
				setMenuVisible(false);
				navigation.navigate(screenName);
			} else {
				setMenuVisible(false);
				Alert.alert(
					"Coming Soon",
					`The ${screenName} feature is under development and will be available soon!`
				);
			}
		} catch (error) {
			console.error("Navigation error:", error);
			Alert.alert("Navigation Error", "Could not navigate to this screen.");
		}
	};

	// Menu items configuration - using direct string names instead of Screens object
	const menuItems = [
		{ title: "Book Library", screen: "BookListScreen", icon: "📚" },
		{ title: "Add New Book", screen: "BookFormScreen", icon: "➕" },
		{ title: "Favorites", screen: "Favorites", icon: "⭐" },
		{ title: "Bookshelf", screen: "Bookshelf", icon: "📖" },
		{ title: "Quotes & Notes", screen: "QuotesAndNotes", icon: "✏️" },
		{ title: "My Photo Uploads", screen: "MyPhotoUploads", icon: "📷" },
	];

	// Regular useEffect for header setup
	useEffect(() => {
		// Setup header options if needed
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			headerShown: false,
		});
	}, [navigation]);

	// Initial data loading effect
	useEffect(() => {
		// Load data on initial mount
		fetchTotalDaysRead();
		checkReadToday();

		// Attempt to load book of the day
		try {
			if (bookWidgetVisible) {
				fetchBookOfTheDay().catch((error) => {
					console.error("Failed to fetch book of the day:", error);
					setBookOfTheDayError("Could not load today's book suggestion");
					setBookOfTheDayLoading(false);
				});
			}
		} catch (error) {
			console.error("Critical error in book of the day initialization:", error);
			setBookWidgetVisible(false);
		}
	}, []); // Empty dependency array means this runs once on mount

	// Fixed: useFocusEffect implementation for screen refresh when navigating back
	useFocusEffect(
		React.useCallback(() => {
			console.log("Welcome screen focused - refreshing data");

			// Refresh data when screen comes back into focus
			fetchTotalDaysRead();
			checkReadToday();

			// No need to return a cleanup function
		}, []) // Empty dependency array means this effect runs on every focus
	);

	// Check if the user has already marked today as read
	const checkReadToday = async () => {
		try {
			const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
			const lastReadDate = await AsyncStorage.getItem("lastReadDate");

			if (lastReadDate === today) {
				setHasReadToday(true);
			} else {
				setHasReadToday(false);
			}
		} catch (error) {
			console.error("Error checking read status:", error);
		}
	};

	// Fetch the total days read count from backend
	const fetchTotalDaysRead = async () => {
		try {
			setIsLoading(true);
			const endpoint = getApiEndpoint("reading-stats/");

			const response = await fetch(endpoint);

			if (response.ok) {
				const data = await response.json();
				setTotalDaysRead(data.total_days_read || 0);
			} else {
				console.error("Failed to fetch reading stats:", response.status);

				// Fallback to locally stored count if backend fails
				const localCount = await AsyncStorage.getItem("totalDaysRead");
				if (localCount) {
					setTotalDaysRead(parseInt(localCount, 10));
				}
			}
		} catch (error) {
			console.error("Error fetching reading stats:", error);

			// Fallback to locally stored count
			const localCount = await AsyncStorage.getItem("totalDaysRead");
			if (localCount) {
				setTotalDaysRead(parseInt(localCount, 10));
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle the "I Read Today!" button press
	const handleReadToday = async () => {
		if (hasReadToday) {
			Alert.alert(
				"Already Recorded",
				"You've already recorded your reading for today!"
			);
			return;
		}

		try {
			setIsLoading(true);
			const today = new Date().toISOString().split("T")[0];
			const endpoint = getApiEndpoint("reading-stats/");

			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					read_date: today,
				}),
			});

			if (response.ok) {
				// Update the local state
				setTotalDaysRead((prevCount) => prevCount + 1);
				setHasReadToday(true);

				// Save to AsyncStorage as backup
				await AsyncStorage.setItem(
					"totalDaysRead",
					(totalDaysRead + 1).toString()
				);
				await AsyncStorage.setItem("lastReadDate", today);

				Alert.alert("Success!", "Your reading day has been recorded!");
			} else {
				// Fallback to local storage if backend fails
				setTotalDaysRead((prevCount) => prevCount + 1);
				setHasReadToday(true);

				await AsyncStorage.setItem(
					"totalDaysRead",
					(totalDaysRead + 1).toString()
				);
				await AsyncStorage.setItem("lastReadDate", today);

				console.error("Backend save failed, using local storage instead");
				Alert.alert(
					"Saved Locally",
					"Your reading day has been recorded locally."
				);
			}
		} catch (error) {
			console.error("Error recording reading day:", error);
			Alert.alert(
				"Error",
				"Failed to record your reading day. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Function to fetch book of the day suggestion - with error boundaries
	const fetchBookOfTheDay = async () => {
		if (!bookWidgetVisible) return;

		try {
			setBookOfTheDayLoading(true);
			setBookOfTheDayError(null);

			// First try to get user's books to analyze patterns
			let userBooks = [];
			try {
				const cachedBooks = await AsyncStorage.getItem("books");
				userBooks = cachedBooks ? JSON.parse(cachedBooks) : [];
			} catch (cacheError) {
				console.log("Could not read cached books:", cacheError);
				// Continue with empty user books array
			}

			// Extract genres and authors from user's books
			const userGenres = userBooks.map((book) => book.genre).filter(Boolean);
			const userAuthors = userBooks.map((book) => book.author).filter(Boolean);

			// If user has no books, use a default recommendation approach
			if (userBooks.length === 0) {
				await fetchRandomBookSuggestion();
				return;
			}

			// Try to fetch a personalized recommendation
			try {
				await fetchPersonalizedBookSuggestion(userGenres, userAuthors);
			} catch (error) {
				console.log("Personalized suggestion failed, using random:", error);
				await fetchRandomBookSuggestion();
			}
		} catch (error) {
			console.error("Error in main fetchBookOfTheDay function:", error);
			setBookOfTheDayError("Could not load today's book suggestion");

			// Use a fallback option that won't make API calls
			setBookOfTheDay({
				title: "Pride and Prejudice",
				author: "Jane Austen",
				genre: "classic",
				description: "A classic novel of manners.",
				source: "fallback",
				emoji: "📚",
			});
		} finally {
			setBookOfTheDayLoading(false);
		}
	};

	// Fetch a personalized book suggestion based on user's reading history
	const fetchPersonalizedBookSuggestion = async (genres, authors) => {
		// Take the most common genre and a random author the user has read
		const genreCounts = genres.reduce((acc, genre) => {
			acc[genre] = (acc[genre] || 0) + 1;
			return acc;
		}, {});

		const topGenre =
			Object.entries(genreCounts)
				.sort((a, b) => b[1] - a[1])
				.map((entry) => entry[0])[0] || "fiction";

		const randomAuthor =
			authors.length > 0
				? authors[Math.floor(Math.random() * authors.length)]
				: "";

		// Use Open Library API to find a book suggestion
		const searchTerm = randomAuthor
			? `${topGenre} ${randomAuthor.split(" ").pop()}`
			: topGenre;

		const response = await fetch(
			`https://openlibrary.org/search.json?q=${encodeURIComponent(
				searchTerm
			)}&limit=10`
		);

		if (!response.ok) {
			throw new Error(`Open Library API returned ${response.status}`);
		}

		const data = await response.json();

		if (data.docs && data.docs.length > 0) {
			// Filter out books the user already has
			const existingBookTitles = new Set(
				userBooks.map((book) => book.title.toLowerCase())
			);
			const newSuggestions = data.docs.filter(
				(book) => !existingBookTitles.has((book.title || "").toLowerCase())
			);

			if (newSuggestions.length > 0) {
				// Pick a random book from filtered suggestions
				const randomIndex = Math.floor(Math.random() * newSuggestions.length);
				const suggestion = newSuggestions[randomIndex];

				setBookOfTheDay({
					title: suggestion.title,
					author: suggestion.author_name
						? suggestion.author_name.join(", ")
						: "Unknown",
					coverUrl: suggestion.cover_i
						? `https://covers.openlibrary.org/b/id/${suggestion.cover_i}-L.jpg`
						: null,
					publishYear: suggestion.first_publish_year,
					olKey: suggestion.key,
					description: "A recommended book based on your reading preferences.",
					// Include metadata that would help with quick add
					genre: topGenre,
					source: "open_library",
					sourceId: suggestion.key,
				});
			} else {
				// Fallback if all suggestions are already in the user's library
				await fetchRandomBookSuggestion();
			}
		} else {
			await fetchRandomBookSuggestion();
		}
	};

	// Fallback function to fetch a random book suggestion - simplified for reliability
	const fetchRandomBookSuggestion = async () => {
		try {
			// List of classic books that are generally well-regarded
			const classicBooks = [
				{
					title: "Pride and Prejudice",
					author: "Jane Austen",
					genre: "classic",
				},
				{
					title: "To Kill a Mockingbird",
					author: "Harper Lee",
					genre: "fiction",
				},
				{ title: "1984", author: "George Orwell", genre: "dystopian" },
				{
					title: "The Great Gatsby",
					author: "F. Scott Fitzgerald",
					genre: "classic",
				},
				{
					title: "Brave New World",
					author: "Aldous Huxley",
					genre: "dystopian",
				},
			];

			// Select a random book
			const randomBook =
				classicBooks[Math.floor(Math.random() * classicBooks.length)];

			// Set a basic book suggestion without making additional API calls
			setBookOfTheDay({
				...randomBook,
				description: "A classic book that every reader should explore.",
				source: "default",
				coverUrl: null,
			});
		} catch (error) {
			console.error("Error in fetchRandomBookSuggestion:", error);
			// Set a very simple fallback
			setBookOfTheDay({
				title: "Pride and Prejudice",
				author: "Jane Austen",
				genre: "classic",
				description: "A classic novel of manners.",
				source: "fallback",
			});
		}
	};

	// Function to quickly add the suggested book to the user's library
	const quickAddSuggestedBook = async () => {
		if (!bookOfTheDay) return;

		try {
			// Show loading state
			setBookOfTheDayLoading(true);

			// Create form data for the new book
			const formData = new FormData();
			formData.append("title", bookOfTheDay.title);
			formData.append("author", bookOfTheDay.author);
			formData.append("genre", bookOfTheDay.genre || "unknown");

			// Add book notes if we have a description
			if (bookOfTheDay.description) {
				formData.append("book_notes", bookOfTheDay.description);
			}

			// Add cover URL if available
			if (bookOfTheDay.coverUrl) {
				formData.append("external_cover_url", bookOfTheDay.coverUrl);
			}

			// Set toBeRead status
			formData.append("toBeRead", "true");

			// Submit to API
			const endpoint = getApiEndpoint("books/");
			const response = await fetch(endpoint, {
				method: "POST",
				body: formData,
				headers: {
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to add book: ${response.status}`);
			}

			const data = await response.json();
			console.log("Book added successfully:", data);

			// Show success message
			Alert.alert(
				"Book Added",
				`"${bookOfTheDay.title}" has been added to your To Be Read list!`,
				[
					{
						text: "View My Books",
						onPress: () =>
							navigation.navigate("BookListScreen", { refresh: Date.now() }),
					},
					{
						text: "Stay Here",
						style: "cancel",
						onPress: () => {
							// Fetch a new book suggestion
							fetchBookOfTheDay();
						},
					},
				]
			);
		} catch (error) {
			console.error("Error adding suggested book:", error);
			Alert.alert(
				"Error",
				"Could not add the book to your library. Please try again."
			);
		} finally {
			setBookOfTheDayLoading(false);
		}
	};

	// Render the Book of the Day widget - with error boundaries
	const renderBookOfTheDay = () => {
		if (!bookWidgetVisible) return null;

		try {
			if (bookOfTheDayLoading && !bookOfTheDay) {
				return (
					<View style={styles.bookOfTheDayCard}>
						<Text style={styles.bookOfTheDayTitle}>Book of the Day</Text>
						<View style={styles.bookOfTheDayLoading}>
							<ActivityIndicator size="large" color="#0000ff" />
							<Text style={styles.loadingText}>
								Finding the perfect book for you...
							</Text>
						</View>
					</View>
				);
			}

			if (bookOfTheDayError && !bookOfTheDay) {
				return (
					<View style={styles.bookOfTheDayCard}>
						<Text style={styles.bookOfTheDayTitle}>Book of the Day</Text>
						<Text style={styles.errorText}>{bookOfTheDayError}</Text>
						<TouchableOpacity
							style={styles.retryButton}
							onPress={fetchBookOfTheDay}
						>
							<Text style={styles.retryButtonText}>Try Again</Text>
						</TouchableOpacity>
					</View>
				);
			}

			if (!bookOfTheDay) return null;

			return (
				<View style={styles.bookOfTheDayCard}>
					<Text style={styles.bookOfTheDayTitle}>Book of the Day</Text>
					<View style={styles.bookOfTheDayContent}>
						{bookOfTheDay.coverUrl ? (
							<Image
								source={{ uri: bookOfTheDay.coverUrl }}
								style={styles.bookCover}
								resizeMode="contain"
							/>
						) : (
							<View style={styles.placeholderCover}>
								<Text style={styles.placeholderText}>
									{bookOfTheDay.title.substring(0, 1)}
								</Text>
							</View>
						)}

						<View style={styles.bookDetails}>
							<Text style={styles.bookTitle}>{bookOfTheDay.title}</Text>
							<Text style={styles.bookAuthor}>by {bookOfTheDay.author}</Text>
							{bookOfTheDay.publishYear && (
								<Text style={styles.bookYear}>{bookOfTheDay.publishYear}</Text>
							)}
							<Text style={styles.bookGenre}>
								Genre:{" "}
								{bookOfTheDay.genre
									? bookOfTheDay.genre.charAt(0).toUpperCase() +
									  bookOfTheDay.genre.slice(1)
									: "General"}
							</Text>
							<Text style={styles.bookDescription} numberOfLines={2}>
								{bookOfTheDay.description}
							</Text>
						</View>
					</View>

					<TouchableOpacity
						style={styles.quickAddButton}
						onPress={quickAddSuggestedBook}
						disabled={bookOfTheDayLoading}
					>
						{bookOfTheDayLoading ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<Text style={styles.quickAddButtonText}>Add to My Books</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.newSuggestionButton}
						onPress={fetchBookOfTheDay}
						disabled={bookOfTheDayLoading}
					>
						<Text style={styles.newSuggestionButtonText}>
							Get New Suggestion
						</Text>
					</TouchableOpacity>
				</View>
			);
		} catch (error) {
			console.error("Error rendering Book of the Day widget:", error);
			return null; // Return null if rendering fails to prevent the whole screen from crashing
		}
	};

	// Main render function - wrapped in error boundary
	try {
		return (
			<SafeAreaView style={styles.container}>
				<ScrollView style={styles.scrollView}>
					{/* Main welcome content */}
					<View style={styles.header}>
						<Text style={styles.welcomeTitle}>Welcome to BookWyrm</Text>
						<Text style={styles.welcomeSubtitle}>
							Your personal book companion
						</Text>
					</View>

					{/* Reading statistics card - Add this section */}
					<View style={styles.statsCard}>
						<Text style={styles.statsTitle}>Reading Stats</Text>
						{isLoading ? (
							<ActivityIndicator size="small" color="#3498db" />
						) : (
							<View style={styles.statsContent}>
								<View style={styles.statItem}>
									<Text style={styles.statValue}>{totalDaysRead}</Text>
									<Text style={styles.statLabel}>Days Read</Text>
								</View>

								<TouchableOpacity
									style={[
										styles.readTodayButton,
										hasReadToday && styles.readTodayButtonDisabled,
									]}
									onPress={() =>
										Alert.alert(
											"Coming Soon",
											"This feature will be available soon!"
										)
									}
									disabled={hasReadToday}
								>
									<Text style={styles.readTodayButtonText}>
										{hasReadToday ? "Read Today ✓" : "I Read Today!"}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>

					{/* Main action buttons */}
					<View style={styles.buttonsContainer}>
						<TouchableOpacity
							style={styles.mainButton}
							onPress={() => navigation.navigate("BookListScreen")}
						>
							<Text style={styles.mainButtonText}>My Books</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.mainButton}
							onPress={() => navigation.navigate("BookFormScreen")}
						>
							<Text style={styles.mainButtonText}>Add New Book</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.mainButton}
							onPress={() => navigation.navigate("Favorites")}
						>
							<Text style={styles.mainButtonText}>Favorites</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.mainButton}
							onPress={() => navigation.navigate("Trash")}
						>
							<Text style={styles.mainButtonText}>Recently Deleted</Text>
						</TouchableOpacity>
					</View>

					{/* Add the Book of the Day widget in a way that won't crash the app */}
					{renderBookOfTheDay()}

					{/* Debug information (dev only) */}
					{__DEV__ && (
						<View style={styles.debugInfo}>
							<Text style={styles.debugText}>Running on: {Platform.OS}</Text>
							<Text style={styles.debugText}>Version: {Platform.Version}</Text>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>
		);
	} catch (error) {
		console.error("Critical error in welcome screen render:", error);
		// Fallback render for complete failure - ensures something always renders
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ justifyContent: "center", alignItems: "center" },
				]}
			>
				<Text style={styles.welcomeTitle}>Welcome to BookWyrm</Text>
				<TouchableOpacity
					style={styles.mainButton}
					onPress={() => navigation.navigate("BookListScreen")}
				>
					<Text style={styles.mainButtonText}>My Books</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		flex: 1,
		padding: 20,
	},
	header: {
		alignItems: "center",
		marginVertical: 20,
	},
	welcomeTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#3498db",
		marginBottom: 10,
	},
	welcomeSubtitle: {
		fontSize: 18,
		color: "#7f8c8d",
		textAlign: "center",
	},
	buttonsContainer: {
		marginVertical: 20,
	},
	mainButton: {
		backgroundColor: "#3498db",
		padding: 15,
		borderRadius: 8,
		marginVertical: 10,
		alignItems: "center",
	},
	mainButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "500",
	},
	// Book of the Day styles
	bookOfTheDayCard: {
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 15,
		marginVertical: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	bookOfTheDayTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
		color: "#3498db",
	},
	bookOfTheDayContent: {
		flexDirection: "row",
		marginBottom: 15,
	},
	bookCover: {
		width: 100,
		height: 150,
		borderRadius: 5,
		backgroundColor: "#f0f0f0",
	},
	placeholderCover: {
		width: 100,
		height: 150,
		borderRadius: 5,
		backgroundColor: "#e0e0e0",
		justifyContent: "center",
		alignItems: "center",
	},
	placeholderText: {
		fontSize: 36,
		fontWeight: "bold",
		color: "#999",
	},
	bookDetails: {
		flex: 1,
		marginLeft: 15,
		justifyContent: "center",
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 5,
	},
	bookAuthor: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	bookYear: {
		fontSize: 12,
		color: "#888",
		marginBottom: 5,
	},
	bookGenre: {
		fontSize: 12,
		color: "#888",
		marginBottom: 5,
	},
	bookDescription: {
		fontSize: 12,
		color: "#666",
		marginTop: 5,
	},
	quickAddButton: {
		backgroundColor: "#2ecc71",
		padding: 12,
		borderRadius: 5,
		alignItems: "center",
		marginBottom: 8,
	},
	quickAddButtonText: {
		color: "white",
		fontWeight: "bold",
	},
	newSuggestionButton: {
		backgroundColor: "transparent",
		padding: 8,
		borderRadius: 5,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#3498db",
	},
	newSuggestionButtonText: {
		color: "#3498db",
	},
	bookOfTheDayLoading: {
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
		textAlign: "center",
	},
	errorText: {
		color: "#e74c3c",
		textAlign: "center",
		marginBottom: 10,
	},
	retryButton: {
		backgroundColor: "#3498db",
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 5,
		alignSelf: "center",
	},
	retryButtonText: {
		color: "white",
	},
	// Hamburger menu styles
	menuButton: {
		position: "absolute",
		top: 40,
		left: 20,
		zIndex: 100,
		padding: 10,
	},
	menuButtonText: {
		fontSize: 30,
		color: "#2c3e50",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	dropdownMenu: {
		position: "absolute",
		top: 80,
		left: 20,
		backgroundColor: "white",
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 4,
		width: 200,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	menuItemIcon: {
		fontSize: 20,
		marginRight: 12,
	},
	menuItemText: {
		fontSize: 16,
		color: "#2c3e50",
	},
	// New styles for the reading counter and button
	counterContainer: {
		position: "absolute",
		top: Platform.OS === "ios" ? 40 : 20,
		right: 20,
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	counterLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#007BFF",
		textAlign: "center",
	},
	counterValue: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#007BFF",
	},
	readTodayButton: {
		backgroundColor: "#28a745", // Green color
		paddingVertical: 15,
		paddingHorizontal: 30,
		borderRadius: 10,
		marginBottom: 20,
		marginTop: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 5,
	},
	readTodayButtonDisabled: {
		backgroundColor: "#6c757d", // Gray when already read today
	},
	readTodayButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		textAlign: "center",
	},
	// Add debug styles
	debugInfo: {
		marginTop: 20,
		padding: 10,
		backgroundColor: "#f0f0f0",
		borderRadius: 5,
	},
	debugText: {
		fontSize: 12,
		color: "#666",
	},
	// New styles for reading stats card
	statsCard: {
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	statsTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
		color: "#3498db",
	},
	statsContent: {
		alignItems: "center",
	},
	statItem: {
		alignItems: "center",
		marginBottom: 10,
	},
	statValue: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#2c3e50",
	},
	statLabel: {
		fontSize: 14,
		color: "#7f8c8d",
	},
});
