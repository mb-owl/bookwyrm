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
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiEndpoint } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

export default function WelcomeScreen({ navigation }) {
	// Basic state variables
	const [totalDaysRead, setTotalDaysRead] = useState(0);
	const [hasReadToday, setHasReadToday] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Book of the Day state
	const [bookOfTheDay, setBookOfTheDay] = useState(null);
	const [bookOfTheDayLoading, setBookOfTheDayLoading] = useState(false);
	const [bookOfTheDayError, setBookOfTheDayError] = useState(null);
	const [bookWidgetVisible, setBookWidgetVisible] = useState(true);

	// Navigation setup
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			headerShown: false,
		});
	}, [navigation]);

	// Initialize Book of the Day
	useEffect(() => {
		if (bookWidgetVisible) {
			fetchBookOfTheDay().catch((error) => {
				console.error("Failed to fetch book of the day:", error);
				setBookOfTheDayError("Could not load today's book suggestion");
				setBookOfTheDayLoading(false);
			});
		}
	}, [bookWidgetVisible]);

	// Refresh reading stats when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			fetchTotalDaysRead();
			checkReadToday();
		}, [])
	);

	// FETCH DATA FUNCTIONS

	// Check if user has recorded reading today
	const checkReadToday = async () => {
		try {
			const today = new Date().toISOString().split("T")[0];
			const lastReadDate = await AsyncStorage.getItem("lastReadDate");
			setHasReadToday(lastReadDate === today);
		} catch (error) {
			console.error("Error checking read status:", error);
		}
	};

	// Fetch total days read count
	const fetchTotalDaysRead = async () => {
		try {
			setIsLoading(true);
			const endpoint = getApiEndpoint("reading-stats/");
			const response = await fetch(endpoint);

			if (response.ok) {
				const data = await response.json();
				setTotalDaysRead(data.total_days_read || 0);
			} else {
				// Fallback to local storage
				const localCount = await AsyncStorage.getItem("totalDaysRead");
				if (localCount) setTotalDaysRead(parseInt(localCount, 10));
			}
		} catch (error) {
			console.error("Error fetching reading stats:", error);
			const localCount = await AsyncStorage.getItem("totalDaysRead");
			if (localCount) setTotalDaysRead(parseInt(localCount, 10));
		} finally {
			setIsLoading(false);
		}
	};

	// Record today's reading
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

			// Try to save to backend
			try {
				const response = await fetch(endpoint, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ read_date: today }),
				});
				if (!response.ok) throw new Error("Backend request failed");
			} catch (apiError) {
				console.error("Backend save failed, using local storage instead");
			}

			// Update local state and storage regardless
			const newCount = totalDaysRead + 1;
			setTotalDaysRead(newCount);
			setHasReadToday(true);
			await AsyncStorage.setItem("totalDaysRead", newCount.toString());
			await AsyncStorage.setItem("lastReadDate", today);

			Alert.alert("Success!", "Your reading day has been recorded!");
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

	// BOOK OF THE DAY FUNCTIONS

	// Main function to fetch book suggestion
	const fetchBookOfTheDay = async () => {
		if (!bookWidgetVisible) return;

		try {
			setBookOfTheDayLoading(true);
			setBookOfTheDayError(null);

			// Get user's books for recommendation
			let userBooks = [];
			try {
				const cachedBooks = await AsyncStorage.getItem("books");
				userBooks = cachedBooks ? JSON.parse(cachedBooks) : [];
			} catch (error) {
				console.log("Could not read cached books:", error);
			}

			// Try personalized or random recommendation
			if (userBooks.length === 0) {
				await fetchRandomBookSuggestion();
			} else {
				try {
					const userGenres = userBooks
						.map((book) => book.genre)
						.filter(Boolean);
					const userAuthors = userBooks
						.map((book) => book.author)
						.filter(Boolean);
					await fetchPersonalizedBookSuggestion(
						userGenres,
						userAuthors,
						userBooks
					);
				} catch (error) {
					console.log("Personalized suggestion failed, using random:", error);
					await fetchRandomBookSuggestion();
				}
			}
		} catch (error) {
			console.error("Error fetching book of the day:", error);
			setBookOfTheDayError("Could not load today's book suggestion");
			// Fallback book
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

	// Fetch a personalized book suggestion
	const fetchPersonalizedBookSuggestion = async (
		genres,
		authors,
		userBooks
	) => {
		// Find most common genre
		const genreCounts = genres.reduce((acc, genre) => {
			acc[genre] = (acc[genre] || 0) + 1;
			return acc;
		}, {});

		const topGenre =
			Object.entries(genreCounts)
				.sort((a, b) => b[1] - a[1])
				.map((entry) => entry[0])[0] || "fiction";

		// Pick a random author
		const randomAuthor =
			authors.length > 0
				? authors[Math.floor(Math.random() * authors.length)]
				: "";

		// Build search query
		const searchTerm = randomAuthor
			? `${topGenre} ${randomAuthor.split(" ").pop()}`
			: topGenre;

		// Search Open Library
		const response = await fetch(
			`https://openlibrary.org/search.json?q=${encodeURIComponent(
				searchTerm
			)}&limit=10`
		);

		if (!response.ok) {
			throw new Error(`Open Library API error: ${response.status}`);
		}

		const data = await response.json();

		if (data.docs && data.docs.length > 0) {
			// Avoid suggesting books the user already has
			const existingBookTitles = new Set(
				userBooks.map((book) => book.title.toLowerCase())
			);
			const newSuggestions = data.docs.filter(
				(book) => !existingBookTitles.has((book.title || "").toLowerCase())
			);

			if (newSuggestions.length > 0) {
				// Select a random book from suggestions
				const suggestion =
					newSuggestions[Math.floor(Math.random() * newSuggestions.length)];

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
					genre: topGenre,
					source: "open_library",
					sourceId: suggestion.key,
				});
			} else {
				await fetchRandomBookSuggestion();
			}
		} else {
			await fetchRandomBookSuggestion();
		}
	};

	// Fallback function for random book suggestion
	const fetchRandomBookSuggestion = async () => {
		try {
			// Curated list of classic books
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

			// Pick a random book
			const randomBook =
				classicBooks[Math.floor(Math.random() * classicBooks.length)];

			setBookOfTheDay({
				...randomBook,
				description: "A classic book that every reader should explore.",
				source: "default",
				coverUrl: null,
			});
		} catch (error) {
			console.error("Error in random book suggestion:", error);
			// Simple fallback
			setBookOfTheDay({
				title: "Pride and Prejudice",
				author: "Jane Austen",
				genre: "classic",
				description: "A classic novel of manners.",
				source: "fallback",
			});
		}
	};

	// Add suggested book to library
	const quickAddSuggestedBook = async () => {
		if (!bookOfTheDay) return;

		try {
			setBookOfTheDayLoading(true);

			// Create form data
			const formData = new FormData();
			formData.append("title", bookOfTheDay.title);
			formData.append("author", bookOfTheDay.author);
			formData.append("genre", bookOfTheDay.genre || "unknown");

			if (bookOfTheDay.description) {
				formData.append("book_notes", bookOfTheDay.description);
			}

			if (bookOfTheDay.coverUrl) {
				formData.append("external_cover_url", bookOfTheDay.coverUrl);
			}

			formData.append("toBeRead", "true");

			// Submit to API
			const endpoint = getApiEndpoint("books/");
			const response = await fetch(endpoint, {
				method: "POST",
				body: formData,
				headers: { Accept: "application/json" },
			});

			if (!response.ok) {
				throw new Error(`Failed to add book: ${response.status}`);
			}

			// Show success message with navigation options
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
						onPress: () => fetchBookOfTheDay(),
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

	// Render the Book of the Day widget
	const renderBookOfTheDay = () => {
		if (!bookWidgetVisible) return null;

		try {
			// Loading state
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

			// Error state
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

			// No book to display
			if (!bookOfTheDay) return null;

			// Book suggestion
			return (
				<View style={styles.bookOfTheDayCard}>
					<Text style={styles.bookOfTheDayTitle}>Book of the Day</Text>
					<View style={styles.bookOfTheDayContent}>
						{/* Book Cover */}
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

						{/* Book Details */}
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

					{/* Action Buttons */}
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
			return null;
		}
	};

	// Main render function with error boundary
	try {
		return (
			<SafeAreaView style={styles.container}>
				<ScrollView style={styles.scrollView}>
					{/* Welcome Header */}
					<View style={styles.header}>
						<Text style={styles.welcomeTitle}>Welcome to BookWyrm</Text>
						<Text style={styles.welcomeSubtitle}>
							Your personal book companion
						</Text>
					</View>

					{/* Main Navigation Buttons */}
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

					{/* Book of the Day Widget */}
					{renderBookOfTheDay()}

					{/* Debug Information (Development Only) */}
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
		// Fallback for catastrophic failures
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

// Keep existing styles
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
});
