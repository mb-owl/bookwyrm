import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Image,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	Modal,
	ScrollView,
	Alert,
} from "react-native";
// Import API configuration
import {
	API_BASE_URL,
	getMediaUrl,
	getBookPhotosUrl,
} from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

const MyPhotoUploadsScreen = ({ navigation }) => {
	const [photos, setPhotos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// States for filtering and sorting
	const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'bookTitle'
	const [filterText, setFilterText] = useState("");
	const [selectedTag, setSelectedTag] = useState(null);
	const [availableTags, setAvailableTags] = useState([]);

	// Modal states
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [selectedPhoto, setSelectedPhoto] = useState(null);
	const [showPhotoDetail, setShowPhotoDetail] = useState(false);

	// Set up header with hamburger menu
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
			title: "My Book Photos",
		});
	}, [navigation]);

	// Fetch photos from the backend
	useEffect(() => {
		fetchPhotos();
	}, []);

	// Extract all unique tags from photos for filtering
	useEffect(() => {
		if (photos.length > 0) {
			// Extract and flatten all tags from all books
			const allTags = photos.reduce((tags, photo) => {
				if (photo.book.tags) {
					const bookTags = photo.book.tags.split(",").map((tag) => tag.trim());
					return [...tags, ...bookTags];
				}
				return tags;
			}, []);

			// Create a unique set of tags
			const uniqueTags = [...new Set(allTags)].filter((tag) => tag.length > 0);
			setAvailableTags(uniqueTags);
		}
	}, [photos]);

	const fetchPhotos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/book-photos/`);

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data = await response.json();
			console.log("Fetched photos:", data.length);
			setPhotos(data);
		} catch (err) {
			console.error("Error fetching photos:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Apply sorting to photos
	const getSortedPhotos = () => {
		if (!photos) return [];

		let sortedPhotos = [...photos];

		switch (sortBy) {
			case "newest":
				return sortedPhotos.sort(
					(a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
				);
			case "oldest":
				return sortedPhotos.sort(
					(a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at)
				);
			case "bookTitle":
				return sortedPhotos.sort((a, b) =>
					a.book.title.localeCompare(b.book.title)
				);
			default:
				return sortedPhotos;
		}
	};

	// Apply filtering to photos
	const getFilteredPhotos = () => {
		let filtered = getSortedPhotos();

		// Apply text filter (on book title)
		if (filterText) {
			filtered = filtered.filter((photo) =>
				photo.book.title.toLowerCase().includes(filterText.toLowerCase())
			);
		}

		// Apply tag filter
		if (selectedTag) {
			filtered = filtered.filter(
				(photo) =>
					photo.book.tags &&
					photo.book.tags.toLowerCase().includes(selectedTag.toLowerCase())
			);
		}

		return filtered;
	};

	// View photo details
	const handlePhotoPress = (photo) => {
		setSelectedPhoto(photo);
		setShowPhotoDetail(true);
	};

	// Render a tag button
	const renderTagButton = (tag) => (
		<TouchableOpacity
			key={tag}
			style={[
				styles.tagButton,
				selectedTag === tag && styles.selectedTagButton,
			]}
			onPress={() => {
				setSelectedTag(selectedTag === tag ? null : tag);
				setShowFilterModal(false);
			}}
		>
			<Text
				style={[
					styles.tagButtonText,
					selectedTag === tag && styles.selectedTagButtonText,
				]}
			>
				{tag}
			</Text>
		</TouchableOpacity>
	);

	// Render a photo item in the grid
	const renderPhotoItem = ({ item }) => (
		<TouchableOpacity
			style={styles.photoItem}
			onPress={() => handlePhotoPress(item)}
		>
			<Image
				source={{
					uri: item.photo_url.startsWith("http")
						? item.photo_url
						: `${getBookPhotosUrl()}${item.photo_url.split("/").pop()}`,
				}}
				style={styles.thumbnail}
				resizeMode="cover"
			/>
			<Text style={styles.photoTitle} numberOfLines={1}>
				{item.book.title}
			</Text>
		</TouchableOpacity>
	);

	// Render photo detail modal
	const renderPhotoDetailModal = () => (
		<Modal
			visible={showPhotoDetail}
			transparent={true}
			animationType="fade"
			onRequestClose={() => setShowPhotoDetail(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.photoDetailContainer}>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => setShowPhotoDetail(false)}
					>
						<Text style={styles.closeButtonText}>×</Text>
					</TouchableOpacity>

					{selectedPhoto && (
						<ScrollView contentContainerStyle={styles.photoDetailContent}>
							<Image
								source={{
									uri: selectedPhoto.photo_url.startsWith("http")
										? selectedPhoto.photo_url
										: `${getBookPhotosUrl()}${selectedPhoto.photo_url
												.split("/")
												.pop()}`,
								}}
								style={styles.fullImage}
								resizeMode="contain"
							/>

							<View style={styles.photoInfo}>
								<Text style={styles.photoDetailTitle}>
									{selectedPhoto.book.title}
								</Text>
								<Text style={styles.photoDetailAuthor}>
									by {selectedPhoto.book.author}
								</Text>

								<Text style={styles.photoDetailDate}>
									Uploaded:{" "}
									{new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
								</Text>

								{selectedPhoto.book.tags && (
									<View style={styles.tagContainer}>
										<Text style={styles.tagLabel}>Tags:</Text>
										<View style={styles.tagRow}>
											{selectedPhoto.book.tags.split(",").map((tag) => (
												<Text key={tag.trim()} style={styles.tag}>
													{tag.trim()}
												</Text>
											))}
										</View>
									</View>
								)}

								<TouchableOpacity
									style={styles.viewBookButton}
									onPress={() => {
										setShowPhotoDetail(false);
										navigation.navigate("BookDetailScreen", {
											bookId: selectedPhoto.book.id,
										});
									}}
								>
									<Text style={styles.viewBookButtonText}>
										View Book Details
									</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					)}
				</View>
			</View>
		</Modal>
	);

	// Render sort options modal
	const renderSortModal = () => (
		<Modal
			visible={showSortModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowSortModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Sort Photos By</Text>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortBy === "newest" && styles.selectedSortOption,
						]}
						onPress={() => {
							setSortBy("newest");
							setShowSortModal(false);
						}}
					>
						<Text style={styles.sortOptionText}>Newest First</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortBy === "oldest" && styles.selectedSortOption,
						]}
						onPress={() => {
							setSortBy("oldest");
							setShowSortModal(false);
						}}
					>
						<Text style={styles.sortOptionText}>Oldest First</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.sortOption,
							sortBy === "bookTitle" && styles.selectedSortOption,
						]}
						onPress={() => {
							setSortBy("bookTitle");
							setShowSortModal(false);
						}}
					>
						<Text style={styles.sortOptionText}>Book Title</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.closeModalButton}
						onPress={() => setShowSortModal(false)}
					>
						<Text style={styles.closeModalButtonText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	// Render filter options modal
	const renderFilterModal = () => (
		<Modal
			visible={showFilterModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowFilterModal(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Filter Photos</Text>

					<Text style={styles.filterLabel}>By Book Title:</Text>
					<TextInput
						style={styles.filterInput}
						value={filterText}
						onChangeText={setFilterText}
						placeholder="Enter book title..."
						placeholderTextColor="#999"
					/>

					{availableTags.length > 0 && (
						<>
							<Text style={styles.filterLabel}>By Tag:</Text>
							<View style={styles.tagButtonContainer}>
								{availableTags.map((tag) => renderTagButton(tag))}
							</View>
						</>
					)}

					<TouchableOpacity
						style={styles.clearFilterButton}
						onPress={() => {
							setFilterText("");
							setSelectedTag(null);
						}}
					>
						<Text style={styles.clearFilterButtonText}>Clear Filters</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.closeModalButton}
						onPress={() => setShowFilterModal(false)}
					>
						<Text style={styles.closeModalButtonText}>Apply Filters</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	// Display loading state
	if (loading) {
		return (
			<View style={styles.centeredContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Loading your photos...</Text>
			</View>
		);
	}

	// Display error state
	if (error) {
		return (
			<View style={styles.centeredContainer}>
				<Text style={styles.errorText}>Error: {error}</Text>
				<TouchableOpacity style={styles.retryButton} onPress={fetchPhotos}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const filteredPhotos = getFilteredPhotos();

	return (
		<View style={styles.container}>
			{/* Filter status bar */}
			<View style={styles.filterStatusBar}>
				<TouchableOpacity
					style={styles.filterButton}
					onPress={() => setShowSortModal(true)}
				>
					<Text style={styles.filterButtonText}>
						Sort:{" "}
						{sortBy === "newest"
							? "Newest"
							: sortBy === "oldest"
							? "Oldest"
							: "Book Title"}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.filterButton}
					onPress={() => setShowFilterModal(true)}
				>
					<Text style={styles.filterButtonText}>
						{filterText || selectedTag ? "Filters Active" : "Filter"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* Active filters display */}
			{(filterText || selectedTag) && (
				<View style={styles.activeFiltersContainer}>
					<Text style={styles.activeFiltersLabel}>Active Filters:</Text>
					<View style={styles.activeFiltersRow}>
						{filterText && (
							<View style={styles.activeFilter}>
								<Text style={styles.activeFilterText}>Title: {filterText}</Text>
								<TouchableOpacity onPress={() => setFilterText("")}>
									<Text style={styles.removeFilterText}>×</Text>
								</TouchableOpacity>
							</View>
						)}
						{selectedTag && (
							<View style={styles.activeFilter}>
								<Text style={styles.activeFilterText}>Tag: {selectedTag}</Text>
								<TouchableOpacity onPress={() => setSelectedTag(null)}>
									<Text style={styles.removeFilterText}>×</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</View>
			)}

			{/* No photos message */}
			{photos.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No photos found</Text>
					<Text style={styles.emptySubtext}>
						Add photos to your books using the "Me and My Books" feature in the
						book form
					</Text>
				</View>
			) : filteredPhotos.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No photos match your filters</Text>
					<TouchableOpacity
						style={styles.clearFiltersButton}
						onPress={() => {
							setFilterText("");
							setSelectedTag(null);
						}}
					>
						<Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
					</TouchableOpacity>
				</View>
			) : (
				<FlatList
					data={filteredPhotos}
					renderItem={renderPhotoItem}
					keyExtractor={(item, index) => `photo-${item.id || index}`}
					numColumns={3}
					contentContainerStyle={styles.photoGrid}
				/>
			)}

			{/* Modals */}
			{renderSortModal()}
			{renderFilterModal()}
			{renderPhotoDetailModal()}
		</View>
	);
};

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
	photoGrid: {
		padding: 4,
	},
	photoItem: {
		flex: 1 / 3,
		margin: 1,
		aspectRatio: 1,
		backgroundColor: "white",
		borderRadius: 5,
		overflow: "hidden",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1,
	},
	thumbnail: {
		flex: 1,
		width: "100%",
		height: "80%",
	},
	photoTitle: {
		padding: 4,
		fontSize: 10,
		textAlign: "center",
		color: "#333",
	},
	filterStatusBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		padding: 10,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
	filterButton: {
		backgroundColor: "#f0f0f0",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 5,
		flexDirection: "row",
		alignItems: "center",
	},
	filterButtonText: {
		color: "#333",
		fontSize: 14,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	emptyText: {
		fontSize: 18,
		color: "#666",
		marginBottom: 10,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
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
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	sortOption: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	selectedSortOption: {
		backgroundColor: "rgba(52, 152, 219, 0.1)",
	},
	sortOptionText: {
		fontSize: 16,
		color: "#333",
	},
	closeModalButton: {
		backgroundColor: "#3498db",
		paddingVertical: 12,
		borderRadius: 5,
		marginTop: 20,
		alignItems: "center",
	},
	closeModalButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
	},
	filterLabel: {
		fontSize: 16,
		fontWeight: "500",
		marginTop: 15,
		marginBottom: 8,
	},
	filterInput: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 5,
		paddingVertical: 8,
		paddingHorizontal: 12,
		fontSize: 16,
	},
	tagButtonContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 5,
	},
	tagButton: {
		backgroundColor: "#f0f0f0",
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		margin: 4,
	},
	selectedTagButton: {
		backgroundColor: "#3498db",
	},
	tagButtonText: {
		fontSize: 14,
		color: "#666",
	},
	selectedTagButtonText: {
		color: "white",
	},
	clearFilterButton: {
		alignSelf: "center",
		marginTop: 15,
		paddingVertical: 8,
		paddingHorizontal: 15,
	},
	clearFilterButtonText: {
		color: "#e74c3c",
		fontSize: 14,
	},
	activeFiltersContainer: {
		backgroundColor: "#f5f5f5",
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
	activeFiltersLabel: {
		fontSize: 12,
		color: "#666",
		marginBottom: 5,
	},
	activeFiltersRow: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	activeFilter: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#e1f5fe",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 15,
		marginRight: 8,
		marginBottom: 4,
	},
	activeFilterText: {
		fontSize: 12,
		color: "#0277bd",
	},
	removeFilterText: {
		fontSize: 16,
		color: "#0277bd",
		marginLeft: 5,
		fontWeight: "bold",
	},
	clearFiltersButton: {
		backgroundColor: "#e74c3c",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		marginTop: 10,
	},
	clearFiltersButtonText: {
		color: "white",
		fontSize: 16,
	},
	photoDetailContainer: {
		width: "90%",
		height: "80%",
		backgroundColor: "white",
		borderRadius: 10,
		overflow: "hidden",
	},
	closeButton: {
		position: "absolute",
		top: 10,
		right: 10,
		zIndex: 10,
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	closeButtonText: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	photoDetailContent: {
		padding: 15,
	},
	fullImage: {
		width: "100%",
		height: 300,
		borderRadius: 8,
	},
	photoInfo: {
		marginTop: 15,
	},
	photoDetailTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
	photoDetailAuthor: {
		fontSize: 16,
		color: "#666",
		marginBottom: 10,
	},
	photoDetailDate: {
		fontSize: 14,
		color: "#999",
		marginBottom: 15,
	},
	tagContainer: {
		marginTop: 10,
	},
	tagLabel: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 5,
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	tag: {
		backgroundColor: "#f0f0f0",
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 15,
		marginRight: 8,
		marginBottom: 4,
		fontSize: 12,
		color: "#666",
	},
	viewBookButton: {
		backgroundColor: "#3498db",
		paddingVertical: 12,
		borderRadius: 5,
		marginTop: 20,
		alignItems: "center",
	},
	viewBookButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
	},
});

export default MyPhotoUploadsScreen;
