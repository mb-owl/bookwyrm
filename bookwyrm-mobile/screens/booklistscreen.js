import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	TextInput,
	Image,
	Modal,
	Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import API configuration
import { API_BASE_URL, getMediaUrl, getApiEndpoint } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

export default function BookListScreen({ route, navigation }) {
	const [books, setBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortKey, setSortKey] = useState("date"); // default sort by date
	const [showSortModal, setShowSortModal] = useState(false); // New state for sort modal
	const { book, refresh } = route.params || {}; // book object and refresh flag passed from list

	// Add a dependency on 'refresh' to trigger refetch when returning from delete
	useEffect(() => {
		console.log("BookListScreen mounted or refresh triggered");
		fetchBooks();
	}, [refresh]); // This will re-run when the refresh parameter changes

	// Add this to ensure our custom header is respected
	useEffect(() => {
		// Update to include both hamburger menu on left and home button on right
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			headerRight: () => (
				<TouchableOpacity
					style={styles.homeButton}
					onPress={() => navigation.navigate("WelcomeScreen")}
					accessibilityLabel="Go to home screen"
				>
					<Text style={styles.homeButtonText}>🏠</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	const fetchBooks = async () => {
		try {
			setLoading(true);
			console.log("Fetching books...");

			// Use the helper function to get proper URL formatting
			const url = getApiEndpoint("books");
			console.log("Fetching books from:", url);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			});

			console.log("Response status:", response.status);

			if (!response.ok) {
				let errorText = "Unknown error";
				try {
					errorText = await response.text();
					console.error("Server error response:", errorText);
				} catch (e) {
					console.error("Error reading response text:", e);
				}

				throw new Error(`API call failed: ${response.status} ${errorText}`);
			}

			const data = await response.json();
			console.log("Books fetched successfully:", data.length, "books");

			// Log the first book for debugging
			if (data.length > 0) {
				console.log(
					"First book sample:",
					JSON.stringify(data[0]).substring(0, 200) + "..."
				);
			}

			setBooks(data);

			// Update cached data
			AsyncStorage.setItem("books", JSON.stringify(data));
		} catch (error) {
			console.error("Error fetching books:", error);

			// Try to load from cache as fallback
			try {
				const cachedBooks = await AsyncStorage.getItem("books");
				if (cachedBooks) {
					console.log("Loading books from cache");
					setBooks(JSON.parse(cachedBooks));
				}
			} catch (cacheError) {
				console.error("Error loading from cache:", cacheError);
			}

			// Improved error message with more details
			Alert.alert(
				"Connection Error",
				"Could not connect to the server.\n\n" +
					"The app will continue using cached data if available.\n\n" +
					(error.message || "Unknown error")
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFilter = (query) => {
		if (!query) {
			fetchBooks(); // If no query, fetch all books
		} else {
			const filtered = books.filter(
				(book) => book.title.toLowerCase().includes(query.toLowerCase())
				// Note: This appears to be incomplete in the original code
			);
			setBooks(filtered);
		}
	};

	const renderSearchInput = () => (
		<TextInput
			style={styles.searchInput}
			placeholder="Search books..."
			value={searchQuery}
			onChangeText={(text) => {
				setSearchQuery(text);
				handleFilter(text);
			}}
		/>
	);

	// Enhanced sorting functions
	const sortByTitle = () => {
		setSortKey("title");
		const sorted = [...books].sort((a, b) => a.title.localeCompare(b.title));
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByAuthor = () => {
		setSortKey("author");
		const sorted = [...books].sort((a, b) => a.author.localeCompare(b.author));
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByDate = () => {
		setSortKey("date");
		// Sort books by date added (created_at)
		const sorted = [...books].sort(
			(a, b) => new Date(b.created_at) - new Date(a.created_at)
		);
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByRating = () => {
		setSortKey("rating");
		// Sort books by rating (highest first), handling null/undefined ratings
		const sorted = [...books].sort((a, b) => {
			const ratingA =
				a.rating !== null && a.rating !== undefined ? parseFloat(a.rating) : -1;
			const ratingB =
				b.rating !== null && b.rating !== undefined ? parseFloat(b.rating) : -1;
			return ratingB - ratingA;
		});
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByGenre = () => {
		setSortKey("genre");
		// Sort books by genre
		const sorted = [...books].sort((a, b) => {
			// Handle null/undefined genres
			const genreA = a.genre || "unknown";
			const genreB = b.genre || "unknown";
			return genreA.localeCompare(genreB);
		});
		setBooks(sorted);
		setShowSortModal(false);
	};

	// New sort functions for reading status
	const sortByReadStatus = () => {
		setSortKey("read");
		// Sort books by read status (read first)
		const sorted = [...books].sort((a, b) => {
			// Convert boolean to number (true becomes 1, false becomes 0)
			return (b.is_read ? 1 : 0) - (a.is_read ? 1 : 0);
		});
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByToBeReadStatus = () => {
		setSortKey("tbr");
		// Sort books by to-be-read status (TBR first)
		const sorted = [...books].sort((a, b) => {
			return (b.toBeRead ? 1 : 0) - (a.toBeRead ? 1 : 0);
		});
		setBooks(sorted);
		setShowSortModal(false);
	};

	const sortByShelvedStatus = () => {
		setSortKey("shelved");
		// Sort books by shelved status (on shelf first)
		const sorted = [...books].sort((a, b) => {
			return (b.shelved ? 1 : 0) - (a.shelved ? 1 : 0);
		});
		setBooks(sorted);
		setShowSortModal(false);
	};

	// Get display name for current sort option
	const getSortDisplayName = () => {
		switch (sortKey) {
			case "title":
				return "Title";
			case "author":
				return "Author";
			case "date":
				return "Date Added";
			case "rating":
				return "Rating";
			case "genre":
				return "Genre";
			case "read":
				return "Read Status";
			case "tbr":
				return "To Be Read";
			case "shelved":
				return "On Bookshelf";
			default:
				return "Date Added";
		}
	};

	// Sort modal component
	const renderSortModal = () => (
		<Modal
			visible={showSortModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowSortModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Sort Books By</Text>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "title" && styles.selectedSortOption,
						]}
						onPress={sortByTitle}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "title" && styles.selectedSortOptionText,
							]}
						>
							Title
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "author" && styles.selectedSortOption,
						]}
						onPress={sortByAuthor}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "author" && styles.selectedSortOptionText,
							]}
						>
							Author
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "date" && styles.selectedSortOption,
						]}
						onPress={sortByDate}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "date" && styles.selectedSortOptionText,
							]}
						>
							Date Added
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "rating" && styles.selectedSortOption,
						]}
						onPress={sortByRating}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "rating" && styles.selectedSortOptionText,
							]}
						>
							Rating
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "genre" && styles.selectedSortOption,
						]}
						onPress={sortByGenre}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "genre" && styles.selectedSortOptionText,
							]}
						>
							Genre
						</Text>
					</TouchableOpacity>

					<Text style={styles.sectionDivider}>Reading Status</Text>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "read" && styles.selectedSortOption,
						]}
						onPress={sortByReadStatus}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "read" && styles.selectedSortOptionText,
							]}
						>
							Read Status
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "tbr" && styles.selectedSortOption,
						]}
						onPress={sortByToBeReadStatus}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "tbr" && styles.selectedSortOptionText,
							]}
						>
							To Be Read
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortKey === "shelved" && styles.selectedSortOption,
						]}
						onPress={sortByShelvedStatus}
					>
						<Text
							style={[
								styles.sortOptionText,
								sortKey === "shelved" && styles.selectedSortOptionText,
							]}
						>
							On Bookshelf
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => setShowSortModal(false)}
					>
						<Text style={styles.closeButtonText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	const handleDelete = async () => {
		// confirm delete book
		Alert.alert("Delete Book", "Are you sure you want to delete this book?", [
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

						// Make sure the API endpoint has the trailing slash (Django often requires this)
						const deleteUrl = `${API_BASE_URL}/books/${book.id}/`;
						console.log("Attempting to delete book at URL:", deleteUrl);

						// Call API to delete book
						const response = await fetch(deleteUrl, {
							method: "DELETE",
							// Don't set Content-Type for DELETE requests
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

						// Success - update local state immediately
						setBooks(books.filter((b) => b.id !== book.id));

						// Update AsyncStorage
						AsyncStorage.setItem(
							"books",
							JSON.stringify(books.filter((b) => b.id !== book.id))
						);

						Alert.alert("Success", "Book deleted successfully");

						// Modified navigation - go directly to BookListScreen with refresh
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
		]);
	};

	const goToEditForm = () => {
		navigation.navigate("BookFormScreen", { book });
	};

	// Navigate to detail screen on item press
	const openBookDetail = (book) => {
		try {
			navigation.navigate("BookDetailScreen", { book });
		} catch (error) {
			console.error("Navigation error:", error);
			Alert.alert(
				"Error",
				"There was a problem opening this book. Please try again."
			);
		}
	}; // possible error with BookDetailScreen vs BookDetail)

	const renderBookDetail = () => {
		if (!book) return null;

		return (
			<View style={styles.container}>
				<Text style={styles.label}>Title:</Text>
				<Text style={styles.value}>{book.title}</Text>

				<Text style={styles.label}>Author:</Text>
				<Text style={styles.value}>{book.author}</Text>

				{book.cover ? (
					<>
						{/* Debug text - can be removed once everything is working */}
						<Text style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
							Path: {book.cover}
						</Text>
						<Image
							source={{
								uri: book.cover.startsWith("http")
									? book.cover
									: `${getMediaUrl()}covers/${book.cover.split("/").pop()}`,
							}}
							style={styles.coverImage}
							accessible={true}
							accessibilityLabel={`Cover image of ${book.title}`}
							onError={(e) =>
								console.error("Image load error:", e.nativeEvent.error)
							}
						/>
					</>
				) : (
					<Text style={styles.noCoverText}>No cover image available</Text>
				)}

				{/* Add buttons for edit and delete */}
				<View style={styles.buttonRow}>
					<TouchableOpacity
						style={[styles.button, styles.editButton]}
						onPress={goToEditForm}
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
			</View>
		);
	};

	// State for multi-selection mode
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedBooks, setSelectedBooks] = useState([]);
	const [showBulkEditModal, setShowBulkEditModal] = useState(false);

	// Bulk edit state
	const [bulkIsRead, setBulkIsRead] = useState(false);
	const [bulkToBeRead, setBulkToBeRead] = useState(false);
	const [bulkShelved, setBulkShelved] = useState(false);

	// Toggle selection mode
	const toggleSelectionMode = () => {
		setSelectionMode(!selectionMode);
		// Clear selections when exiting selection mode
		if (selectionMode) setSelectedBooks([]);
	};

	// Toggle book selection
	const toggleBookSelection = (book) => {
		if (selectedBooks.some((selected) => selected.id === book.id)) {
			setSelectedBooks(
				selectedBooks.filter((selected) => selected.id !== book.id)
			);
		} else {
			setSelectedBooks([...selectedBooks, book]);
		}
	};

	// Handle bulk edit confirmation
	const handleBulkEdit = async () => {
		try {
			setLoading(true);

			// Make separate requests for each book
			const updatePromises = selectedBooks.map((book) => {
				const updateUrl = getApiEndpoint(`books/${book.id}`);

				const formData = new FormData();
				formData.append("title", book.title);
				formData.append("author", book.author);

				// Only update the status fields we're bulk editing
				formData.append("is_read", bulkIsRead ? "true" : "false");
				formData.append("toBeRead", bulkToBeRead ? "true" : "false");
				formData.append("shelved", bulkShelved ? "true" : "false");

				return fetch(updateUrl, {
					method: "PATCH", // Use PATCH to only update specific fields
					body: formData,
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});
			});

			// Wait for all updates to complete
			await Promise.all(updatePromises);

			// Close modal and refresh books
			setShowBulkEditModal(false);
			setSelectionMode(false);
			setSelectedBooks([]);

			// Show success message
			Alert.alert("Success", `Updated ${selectedBooks.length} books`);

			// Refresh the book list
			fetchBooks();
		} catch (error) {
			console.error("Error during bulk edit:", error);
			Alert.alert("Error", "Failed to update books. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Handle bulk delete
	const handleBulkDelete = () => {
		Alert.alert(
			"Delete Multiple Books",
			`Are you sure you want to delete ${selectedBooks.length} books? This cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setLoading(true);

							// Make separate requests for each book deletion
							const deletePromises = selectedBooks.map((book) => {
								const deleteUrl = getApiEndpoint(`books/${book.id}`);
								return fetch(deleteUrl, { method: "DELETE" });
							});

							// Wait for all deletions to complete
							await Promise.all(deletePromises);

							// Update local state by removing deleted books
							setBooks(
								books.filter(
									(book) =>
										!selectedBooks.some((selected) => selected.id === book.id)
								)
							);

							// Exit selection mode
							setSelectionMode(false);
							setSelectedBooks([]);

							// Show success message
							Alert.alert("Success", `Deleted ${selectedBooks.length} books`);

							// Update cache
							AsyncStorage.setItem(
								"books",
								JSON.stringify(
									books.filter(
										(book) =>
											!selectedBooks.some((selected) => selected.id === book.id)
									)
								)
							);
						} catch (error) {
							console.error("Error during bulk delete:", error);
							Alert.alert("Error", "Failed to delete books. Please try again.");
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	};

	// Render for FlatList items
	const renderItem = ({ item }) => (
		<TouchableOpacity
			style={[
				styles.item,
				selectedBooks.some((book) => book.id === item.id) &&
					styles.selectedItem,
			]}
			onPress={() => {
				if (selectionMode) {
					toggleBookSelection(item);
				} else {
					openBookDetail(item);
				}
			}}
			onLongPress={() => {
				if (!selectionMode) {
					setSelectionMode(true);
					toggleBookSelection(item);
				}
			}}
			accessible={true}
			accessibilityLabel={`Book: ${item.title}`}
		>
			<View style={styles.itemRow}>
				{selectionMode && (
					<View
						style={[
							styles.checkbox,
							selectedBooks.some((book) => book.id === item.id) &&
								styles.checkboxSelected,
						]}
					>
						{selectedBooks.some((book) => book.id === item.id) && (
							<Text style={styles.checkmark}>✓</Text>
						)}
					</View>
				)}
				<View style={styles.itemContent}>
					<Text style={styles.title}>{item.title}</Text>
					<Text style={styles.author}>{item.author}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	// Bulk Edit Modal
	const renderBulkEditModal = () => (
		<Modal
			visible={showBulkEditModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowBulkEditModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>
						Edit {selectedBooks.length} Books
					</Text>

					<View style={styles.switchContainer}>
						<Text style={styles.switchLabel}>Already Read:</Text>
						<Switch
							value={bulkIsRead}
							onValueChange={setBulkIsRead}
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={bulkIsRead ? "#f5dd4b" : "#f4f3f4"}
						/>
					</View>

					<View style={styles.switchContainer}>
						<Text style={styles.switchLabel}>To Be Read:</Text>
						<Switch
							value={bulkToBeRead}
							onValueChange={setBulkToBeRead}
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={bulkToBeRead ? "#f5dd4b" : "#f4f3f4"}
						/>
					</View>

					<View style={styles.switchContainer}>
						<Text style={styles.switchLabel}>On Bookshelf:</Text>
						<Switch
							value={bulkShelved}
							onValueChange={setBulkShelved}
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={bulkShelved ? "#f5dd4b" : "#f4f3f4"}
						/>
					</View>

					<View style={styles.modalButtonRow}>
						<TouchableOpacity
							style={[styles.modalButton, styles.cancelButton]}
							onPress={() => setShowBulkEditModal(false)}
						>
							<Text style={styles.modalButtonText}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.modalButton, styles.saveButton]}
							onPress={handleBulkEdit}
						>
							<Text style={styles.modalButtonText}>Save Changes</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);

	// Selection action bar
	const renderSelectionBar = () => {
		if (!selectionMode) return null;

		return (
			<View style={styles.selectionBar}>
				<Text style={styles.selectionText}>
					{selectedBooks.length} book{selectedBooks.length !== 1 ? "s" : ""}{" "}
					selected
				</Text>
				<View style={styles.selectionButtons}>
					<TouchableOpacity
						style={[
							styles.selectionButton,
							selectedBooks.length === 0 && styles.disabledButton,
						]}
						onPress={() => setShowBulkEditModal(true)}
						disabled={selectedBooks.length === 0}
					>
						<Text style={styles.selectionButtonText}>Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.selectionButton,
							styles.deleteButton,
							selectedBooks.length === 0 && styles.disabledButton,
						]}
						onPress={handleBulkDelete}
						disabled={selectedBooks.length === 0}
					>
						<Text style={styles.selectionButtonText}>Delete</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.selectionButton}
						onPress={toggleSelectionMode}
					>
						<Text style={styles.selectionButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	// Replace the sort row with a button to open the sort modal
	const renderSortButton = () => (
		<View style={styles.sortButtonContainer}>
			<Text style={styles.sortLabel}>Sort by:</Text>
			<TouchableOpacity
				style={styles.sortButton}
				onPress={() => setShowSortModal(true)}
			>
				<Text style={styles.sortButtonText}>{getSortDisplayName()}</Text>
				<Text style={styles.sortButtonIcon}>▼</Text>
			</TouchableOpacity>
		</View>
	);

	// Render book list or detail view based on route params
	if (book) {
		return renderBookDetail();
	}

	if (loading) {
		return (
			<ActivityIndicator
				size="large"
				style={{ flex: 1, justifyContent: "center" }}
			/>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{renderSearchInput()}
				<TouchableOpacity
					style={styles.selectionModeButton}
					onPress={toggleSelectionMode}
				>
					<Text style={styles.selectionModeButtonText}>
						{selectionMode ? "Cancel" : "Select"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* Replace old sort row with new sort button */}
			{renderSortButton()}

			{books.length === 0 ? (
				<Text style={styles.emptyText}>No books added yet.</Text>
			) : (
				<FlatList
					data={books}
					renderItem={renderItem}
					keyExtractor={(item) => item.id.toString()}
					style={[styles.bookList, selectionMode && styles.selectionModeList]}
				/>
			)}

			{/* Render sort modal */}
			{renderSortModal()}

			{/* Render bulk edit modal */}
			{renderBulkEditModal()}

			{/* Render selection action bar */}
			{renderSelectionBar()}

			{/* Add button (hide during selection mode) */}
			{!selectionMode && (
				<TouchableOpacity
					style={styles.addButton}
					onPress={() => navigation.navigate("BookFormScreen")}
					accessible={true}
					accessibilityLabel="Time to start your next adventure! Add new books here."
				>
					<Text style={styles.buttonText}>Add Book</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFF", padding: 16 },
	label: { fontWeight: "bold", fontSize: 16, fontFamily: "Georgia" },
	value: { fontSize: 16, marginBottom: 8, fontFamily: "Georgia" },
	coverImage: { width: 150, height: 220, marginVertical: 16 },
	noImage: { fontStyle: "italic", color: "#777", marginVertical: 16 },
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 24,
	},
	button: { padding: 12, borderRadius: 4, minWidth: 100, alignItems: "center" },
	addButton: {
		padding: 12,
		borderRadius: 4,
		minWidth: 100,
		alignItems: "center",
		backgroundColor: "#4CAF50",
		position: "absolute",
		bottom: 20,
		alignSelf: "center",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	bookList: {
		marginBottom: 60, // Make space for the add button
	},
	editButton: { backgroundColor: "#2196F3" },
	deleteButton: { backgroundColor: "#f44336" },
	buttonText: { color: "#FFF", fontSize: 16 },
	sortRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 8,
		justifyContent: "center",
	},
	sortOption: { marginHorizontal: 8, color: "blue" },
	sortSelected: { fontWeight: "bold", textDecorationLine: "underline" },
	searchInput: {
		borderColor: "#ccc",
		borderWidth: 1,
		borderRadius: 4,
		padding: 8,
		margin: 8,
	},
	item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
	title: { fontSize: 16, fontWeight: "bold" },
	author: { fontSize: 14, color: "#666" },
	emptyText: { textAlign: "center", marginTop: 20, fontStyle: "italic" },
	noCoverText: { fontStyle: "italic", color: "#777", marginVertical: 16 },

	// New styles for selection mode
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingRight: 8,
	},
	selectionModeButton: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: "#f0f0f0",
		borderRadius: 4,
	},
	selectionModeButtonText: {
		color: "#007BFF",
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	itemContent: {
		flex: 1,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#ccc",
		marginRight: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		borderColor: "#007BFF",
		backgroundColor: "#007BFF",
	},
	checkmark: {
		color: "white",
		fontSize: 16,
	},
	selectedItem: {
		backgroundColor: "rgba(0, 123, 255, 0.1)",
	},
	selectionBar: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#ccc",
		padding: 10,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	selectionText: {
		textAlign: "center",
		marginBottom: 8,
		fontSize: 16,
		fontWeight: "bold",
	},
	selectionButtons: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	selectionButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: "#007BFF",
		borderRadius: 4,
		minWidth: 80,
		alignItems: "center",
	},
	selectionButtonText: {
		color: "#fff",
		fontWeight: "500",
	},
	disabledButton: {
		opacity: 0.5,
	},
	selectionModeList: {
		marginBottom: 80, // Extra space for the selection bar
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	switchLabel: {
		fontSize: 16,
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
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
		backgroundColor: "#6c757d",
	},
	saveButton: {
		backgroundColor: "#28a745",
	},
	deleteButton: {
		backgroundColor: "#dc3545",
	},
	modalButtonText: {
		color: "#fff",
		fontSize: 16,
	},
	// Updated or new styles for sorting UI
	sortButtonContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	sortLabel: {
		fontSize: 14,
		marginRight: 8,
		color: "#666",
	},
	sortButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	sortButtonText: {
		fontSize: 14,
		color: "#007BFF",
		fontWeight: "500",
	},
	sortButtonIcon: {
		fontSize: 12,
		color: "#007BFF",
		marginLeft: 4,
	},
	sortOption: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	selectedSortOption: {
		backgroundColor: "rgba(0, 123, 255, 0.1)",
	},
	sortOptionText: {
		fontSize: 16,
		color: "#333",
	},
	selectedSortOptionText: {
		fontWeight: "bold",
		color: "#007BFF",
	},
	sectionDivider: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#666",
		backgroundColor: "#f9f9f9",
		paddingVertical: 8,
		paddingHorizontal: 16,
		marginTop: 8,
	},
	closeButton: {
		marginTop: 16,
		alignSelf: "center",
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#007BFF",
		borderRadius: 4,
	},
	closeButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "500",
	},
	homeButton: {
		padding: 10,
	},
	homeButtonText: {
		fontSize: 24, // Increased size for better visibility
	},
});
