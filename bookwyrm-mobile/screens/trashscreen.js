import React, { useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getApiEndpoint } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

export default function TrashScreen({ navigation }) {
	// State variables
	const [deletedBooks, setDeletedBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedBook, setSelectedBook] = useState(null);
	const [showActionModal, setShowActionModal] = useState(false);
	const [restoring, setRestoring] = useState(false);

	// Refresh deleted books list and set navigation options when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			fetchDeletedBooks();

			navigation.setOptions({
				headerLeft: () => <HamburgerMenu />,
				headerRight: () => (
					<TouchableOpacity
						style={styles.homeButton}
						onPress={() => navigation.navigate("WelcomeScreen")}
					>
						<Text style={styles.homeButtonText}>🏠</Text>
					</TouchableOpacity>
				),
			});
		}, [navigation])
	);

	// Data fetching function
	const fetchDeletedBooks = async () => {
		try {
			setLoading(true);
			setError(null);

			const endpoint = getApiEndpoint("books/trash");
			console.log("Fetching deleted books from:", endpoint);

			const response = await fetch(endpoint);

			if (!response.ok) {
				throw new Error(`Failed to fetch trash: ${response.status}`);
			}

			const data = await response.json();
			console.log(`Found ${data.length} deleted books`);

			// Sort by deletion date, newest first
			data.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
			setDeletedBooks(data);
		} catch (error) {
			console.error("Error fetching deleted books:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	// Helper functions
	const getDaysRemaining = (deletedAt) => {
		if (!deletedAt) return "Unknown";

		const deletionDate = new Date(deletedAt);
		const now = new Date();
		const permanentDeleteDate = new Date(deletionDate);
		permanentDeleteDate.setDate(permanentDeleteDate.getDate() + 30);

		const daysRemaining = Math.ceil(
			(permanentDeleteDate - now) / (1000 * 60 * 60 * 24)
		);
		return daysRemaining > 0 ? daysRemaining : 0;
	};

	const formatDeletedDate = (deletedAt) => {
		if (!deletedAt) return "Unknown date";
		return new Date(deletedAt).toLocaleDateString();
	};

	// Book restoration function
	const restoreBook = async (book) => {
		try {
			setRestoring(true);
			console.log("Attempting to restore book:", book.id, book.title);

			// Construct the endpoint properly ensuring it has the correct format
			// Django REST Framework often requires trailing slashes
			const endpoint = getApiEndpoint(`books/${book.id}/restore`);
			console.log("Using restore endpoint:", endpoint);

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			console.log("Restore response status:", response.status);

			if (!response.ok) {
				// Extract error information
				let errorText = "";
				try {
					const errorData = await response.json();
					errorText = errorData.detail || JSON.stringify(errorData);
					console.error("Server returned JSON error:", errorText);
				} catch (e) {
					try {
						errorText = await response.text();
						console.error("Server returned text error:", errorText);
					} catch (e2) {
						errorText = `HTTP error ${response.status}`;
						console.error("Could not parse error response");
					}
				}
				throw new Error(`Failed to restore book: ${errorText}`);
			}

			// Process successful restoration
			const restoredBook = await response.json();
			console.log("Book restored successfully:", restoredBook);

			// Update state and UI
			setDeletedBooks(deletedBooks.filter((b) => b.id !== book.id));
			setShowActionModal(false);

			// Show navigation options
			Alert.alert(
				"Success",
				`"${book.title}" has been restored to your library.`,
				[
					{
						text: "View Book",
						onPress: () => {
							console.log("Navigating to book detail:", restoredBook);
							navigation.navigate("BookDetailScreen", {
								book: restoredBook,
								restored: true,
							});
						},
					},
					{
						text: "Go to Library",
						onPress: () => {
							console.log(
								"Navigating to book list with restored book ID:",
								book.id
							);
							navigation.navigate("BookListScreen", {
								refresh: Date.now(),
								restored: true,
								restoredBookId: book.id,
								forceDelay: true,
							});
						},
						style: "default",
					},
				]
			);
		} catch (error) {
			console.error("Error restoring book:", error);
			Alert.alert("Error", `Failed to restore the book: ${error.message}`);
			setShowActionModal(false);
		} finally {
			setRestoring(false);
		}
	};

	// Permanent deletion function
	const permanentlyDeleteBook = async (book) => {
		try {
			setLoading(true);

			const endpoint = getApiEndpoint(`books/${book.id}/permanent_delete`);
			console.log("Permanently deleting book:", endpoint);

			const response = await fetch(endpoint, { method: "DELETE" });

			if (!response.ok) {
				throw new Error(`Failed to permanently delete: ${response.status}`);
			}

			// Update state and UI
			setDeletedBooks(deletedBooks.filter((b) => b.id !== book.id));
			setShowActionModal(false);
			Alert.alert("Success", `"${book.title}" has been permanently deleted.`);
		} catch (error) {
			console.error("Error permanently deleting book:", error);
			Alert.alert("Error", `Failed to delete the book: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Empty trash function
	const emptyTrash = () => {
		Alert.alert(
			"Empty Trash",
			"Are you sure you want to permanently delete all books in trash? This cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Empty Trash",
					style: "destructive",
					onPress: async () => {
						try {
							setLoading(true);
							const endpoint = getApiEndpoint("books/empty_trash");
							const response = await fetch(endpoint, { method: "POST" });

							if (!response.ok) {
								throw new Error(`Failed to empty trash: ${response.status}`);
							}

							setDeletedBooks([]);
							Alert.alert("Success", "Trash has been emptied.");
						} catch (error) {
							console.error("Error emptying trash:", error);
							Alert.alert("Error", `Failed to empty trash: ${error.message}`);
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	};

	// UI Rendering components
	const renderBookItem = ({ item }) => (
		<TouchableOpacity
			style={styles.bookItem}
			onPress={() => {
				setSelectedBook(item);
				setShowActionModal(true);
			}}
		>
			<View style={styles.bookInfo}>
				<Text style={styles.bookTitle}>{item.title}</Text>
				<Text style={styles.bookAuthor}>by {item.author}</Text>
				<View style={styles.bookMetaRow}>
					<Text style={styles.deletedDate}>
						Deleted: {formatDeletedDate(item.deleted_at)}
					</Text>
					<Text style={styles.daysRemaining}>
						{getDaysRemaining(item.deleted_at)} days remaining
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	const renderActionModal = () => (
		<Modal
			visible={showActionModal && selectedBook !== null}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowActionModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Book Options</Text>

					{selectedBook && (
						<>
							<Text style={styles.modalBookTitle}>{selectedBook.title}</Text>
							<Text style={styles.modalBookAuthor}>
								by {selectedBook.author}
							</Text>

							<View style={styles.modalInfo}>
								<Text style={styles.modalInfoText}>
									Deleted on {formatDeletedDate(selectedBook.deleted_at)}
								</Text>
								<Text style={styles.modalInfoText}>
									Will be permanently deleted in{" "}
									{getDaysRemaining(selectedBook.deleted_at)} days
								</Text>
							</View>

							<View style={styles.modalButtonsRow}>
								<TouchableOpacity
									style={[
										styles.modalButton,
										styles.restoreButton,
										restoring && styles.disabledButton,
									]}
									onPress={() => restoreBook(selectedBook)}
									disabled={restoring}
								>
									{restoring ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text style={styles.modalButtonText}>Restore</Text>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.modalButton, styles.deleteButton]}
									onPress={() => {
										Alert.alert(
											"Permanent Deletion",
											`Are you sure you want to permanently delete "${selectedBook.title}"? This cannot be undone.`,
											[
												{ text: "Cancel", style: "cancel" },
												{
													text: "Delete Forever",
													style: "destructive",
													onPress: () => permanentlyDeleteBook(selectedBook),
												},
											]
										);
									}}
									disabled={restoring}
								>
									<Text style={styles.modalButtonText}>Delete Forever</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity
								style={styles.closeButton}
								onPress={() => setShowActionModal(false)}
								disabled={restoring}
							>
								<Text style={styles.closeButtonText}>Close</Text>
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>
		</Modal>
	);

	// Conditional rendering for loading and error states
	if (loading && deletedBooks.length === 0) {
		return (
			<View style={styles.centeredContainer}>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text style={styles.loadingText}>Loading trash...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centeredContainer}>
				<Text style={styles.errorText}>Error: {error}</Text>
				<TouchableOpacity
					style={styles.retryButton}
					onPress={fetchDeletedBooks}
				>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// Main component render
	return (
		<View style={styles.container}>
			{/* Loading overlay */}
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color="#0000ff" />
				</View>
			)}

			{/* Header with explanation */}
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Recently Deleted Books</Text>
				<Text style={styles.headerSubtitle}>
					Books remain here for 30 days before being permanently deleted
				</Text>
			</View>

			{/* Book list or empty state */}
			{deletedBooks.length > 0 ? (
				<>
					<FlatList
						data={deletedBooks}
						renderItem={renderBookItem}
						keyExtractor={(item) => item.id.toString()}
						contentContainerStyle={styles.listContainer}
					/>

					{/* Empty trash button */}
					<TouchableOpacity
						style={styles.emptyTrashButton}
						onPress={emptyTrash}
						disabled={loading}
					>
						<Text style={styles.emptyTrashButtonText}>Empty Trash</Text>
					</TouchableOpacity>
				</>
			) : (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No deleted books</Text>
					<Text style={styles.emptySubtext}>
						Books you delete will appear here for 30 days before being
						permanently removed
					</Text>
				</View>
			)}

			{/* Action modal for book options */}
			{renderActionModal()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f8f8",
	},
	centeredContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	headerContainer: {
		padding: 16,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 4,
	},
	headerSubtitle: {
		fontSize: 14,
		color: "#666",
	},
	listContainer: {
		padding: 16,
	},
	bookItem: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
	},
	bookInfo: {
		flex: 1,
	},
	bookTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	bookAuthor: {
		fontSize: 16,
		color: "#666",
		marginBottom: 8,
	},
	bookMetaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 8,
	},
	deletedDate: {
		fontSize: 14,
		color: "#888",
	},
	daysRemaining: {
		fontSize: 14,
		color: "#e74c3c",
		fontWeight: "500",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#666",
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
		color: "white",
		fontSize: 16,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	emptyTrashButton: {
		backgroundColor: "#e74c3c",
		padding: 16,
		borderRadius: 8,
		margin: 16,
		alignItems: "center",
	},
	emptyTrashButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
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
		marginBottom: 20,
		textAlign: "center",
	},
	modalBookTitle: {
		fontSize: 20,
		fontWeight: "bold",
	},
	modalBookAuthor: {
		fontSize: 16,
		color: "#666",
		marginBottom: 16,
	},
	modalInfo: {
		backgroundColor: "#f9f9f9",
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
	},
	modalInfoText: {
		fontSize: 14,
		color: "#666",
		marginBottom: 6,
	},
	modalButtonsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 6,
		alignItems: "center",
		marginHorizontal: 6,
	},
	restoreButton: {
		backgroundColor: "#2ecc71",
	},
	deleteButton: {
		backgroundColor: "#e74c3c",
	},
	modalButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	closeButton: {
		paddingVertical: 12,
		alignItems: "center",
	},
	closeButtonText: {
		color: "#3498db",
		fontSize: 16,
	},
	loadingOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255, 255, 255, 0.7)",
		zIndex: 1000,
	},
	disabledButton: {
		opacity: 0.5,
	},
	homeButton: {
		padding: 10,
	},
	homeButtonText: {
		fontSize: 24,
	},
});
