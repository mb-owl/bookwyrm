import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Image,
	Alert,
} from "react-native";

// Import API configuration
import { API_BASE_URL, getMediaUrl } from "../utils/apiConfig";
import HamburgerMenu from "../components/HamburgerMenu";

const FavoritesScreen = ({ navigation }) => {
	const [favoriteBooks, setFavoriteBooks] = useState([]);
	const [loading, setLoading] = useState(true);

	// Fetch favorite books when screen mounts
	useEffect(() => {
		fetchFavoriteBooks();
	}, []);

	// Add home button to the header
	useEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HamburgerMenu />,
		});
	}, [navigation]);

	const fetchFavoriteBooks = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/books/`);

			if (!response.ok) {
				throw new Error(`Failed to fetch books: ${response.status}`);
			}

			const allBooks = await response.json();

			// Filter only favorite books
			const favorites = allBooks.filter((book) => book.favorite === true);
			setFavoriteBooks(favorites);
		} catch (error) {
			console.error("Error fetching favorite books:", error);
			Alert.alert("Error", "Could not load favorite books. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Navigate to book details
	const openBookDetail = (book) => {
		navigation.navigate("BookDetailScreen", { book });
	};

	// Render book item
	const renderBookItem = ({ item }) => (
		<TouchableOpacity
			style={styles.bookItem}
			onPress={() => openBookDetail(item)}
		>
			<View style={styles.bookContent}>
				{/* Book cover or placeholder */}
				{item.cover ? (
					<Image
						source={{
							uri: item.cover.startsWith("http")
								? item.cover
								: `${getMediaUrl()}covers/${item.cover.split("/").pop()}`,
						}}
						style={styles.bookCover}
						resizeMode="cover"
					/>
				) : (
					<View style={styles.noCover}>
						<Text style={styles.noCoverText}>No Cover</Text>
					</View>
				)}

				{/* Book details */}
				<View style={styles.bookDetails}>
					<Text style={styles.bookTitle}>{item.title}</Text>
					<Text style={styles.bookAuthor}>{item.author}</Text>
					<Text style={styles.favoriteIcon}>⭐</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	// Show loading indicator
	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text style={styles.loadingText}>Loading favorites...</Text>
			</View>
		);
	}

	// Show empty state
	if (favoriteBooks.length === 0) {
		return (
			<View style={styles.centered}>
				<Text style={styles.emptyText}>No favorite books yet.</Text>
				<TouchableOpacity
					style={styles.addButton}
					onPress={() => navigation.navigate("BookListScreen")}
				>
					<Text style={styles.addButtonText}>Browse Books</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// Show list of favorite books
	return (
		<View style={styles.container}>
			<FlatList
				data={favoriteBooks}
				renderItem={renderBookItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.list}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	centered: {
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
	emptyText: {
		fontSize: 18,
		color: "#666",
		marginBottom: 20,
	},
	addButton: {
		backgroundColor: "#3498db",
		padding: 12,
		borderRadius: 6,
	},
	addButtonText: {
		color: "#fff",
		fontSize: 16,
	},
	list: {
		padding: 16,
	},
	bookItem: {
		marginBottom: 16,
		borderRadius: 8,
		backgroundColor: "#f9f9f9",
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	bookContent: {
		flexDirection: "row",
		padding: 12,
	},
	bookCover: {
		width: 70,
		height: 100,
		borderRadius: 4,
	},
	noCover: {
		width: 70,
		height: 100,
		borderRadius: 4,
		backgroundColor: "#e0e0e0",
		justifyContent: "center",
		alignItems: "center",
	},
	noCoverText: {
		fontSize: 12,
		color: "#666",
	},
	bookDetails: {
		flex: 1,
		marginLeft: 12,
		justifyContent: "center",
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 4,
	},
	bookAuthor: {
		fontSize: 14,
		color: "#666",
		marginBottom: 8,
	},
	favoriteIcon: {
		fontSize: 16,
	},
	homeButton: {
		padding: 10,
	},
	homeButtonText: {
		fontSize: 20,
	},
});

export default FavoritesScreen;
