// This is a simple form screen for adding or editing books in a mobile app.
// It includes fields for title, author, and cover image, with functionality to pick an image from the library.
// The form handles both creating a new book and updating an existing one, with appropriate API calls.
// The styles are defined using StyleSheet for better performance and maintainability.
// The code uses React Native components and hooks, along with Expo's ImagePicker for image selection.
// The form also includes basic validation to ensure that title and author fields are filled before submission.
// The user is alerted if there are any issues with image selection or form submission.
// The screen is designed to be user-friendly, with clear labels and buttons for interaction.

import React, { useState, useEffect } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

// Define IP addresses for different environments
const LOCAL_IP_ADDRESS = "http://192.168.0.57:8000/api";
const BASE_URL = "http://127.0.0.1:8000/api";

// Use BASE_URL for API calls
const API_BASE_URL = BASE_URL;

export default function BookFormScreen({ route, navigation }) {
	const editingBook = route.params?.book;
	const [title, setTitle] = useState(editingBook ? editingBook.title : "");
	const [author, setAuthor] = useState(editingBook ? editingBook.author : "");
	const [genre, setGenre] = useState(
		editingBook ? editingBook.genre : "fiction"
	);
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

	// Convert genre from string to array for multiple selection
	const [genres, setGenres] = useState(
		editingBook && editingBook.genre
			? editingBook.genre.split(",").map((g) => g.trim())
			: ["fiction"]
	);
	const [showGenreModal, setShowGenreModal] = useState(false);

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

	//request permission for image library access
	useEffect(() => {
		(async () => {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Permission to access camera roll is required!");
			}
		})();
	}, []);

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

	// Handle the form submission to match Django model fields exactly
	const handleSubmit = async () => {
		if (!title || !author) {
			Alert.alert("Title and author are required fields.");
			return;
		}

		setUploading(true);
		try {
			let formData = new FormData();
			formData.append("title", title);
			formData.append("author", author);

			// Match the exact field name in models.py - singular 'genre' not 'genres'
			formData.append("genre", genres.join(","));

			// Combine vibes and thoughts into book_notes with a separator
			const combinedNotes = vibes
				? `${vibes}--VIBES_SEPARATOR--${thoughts}`
				: thoughts;

			formData.append("book_notes", combinedNotes);

			// Format rating to have 2 decimal places, ensuring it matches the DecimalField
			const formattedRating = parseFloat(rating).toFixed(2);
			formData.append("rating", formattedRating);

			// Boolean fields - match exact Django model field names
			formData.append("is_read", isRead ? "true" : "false");
			formData.append("toBeRead", toBeRead ? "true" : "false"); // Match camelCase as in model
			formData.append("shelved", shelved ? "true" : "false");

			// Create a proper ISO date string for Django DateField
			const dateObj = new Date(publicationYear, 0, 1);
			const formattedDate = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
			formData.append("publication_date", formattedDate);

			// Handle cover image - the field name in models.py is 'cover'
			if (coverImage && !coverImage.canceled) {
				// Handle new Expo ImagePicker response format
				let uri;

				// Check if image is in the new format with assets array
				if (coverImage.assets && coverImage.assets.length > 0) {
					uri = coverImage.assets[0].uri;
				}
				// Fall back to old format if needed
				else if (coverImage.uri) {
					uri = coverImage.uri;
				}

				if (uri) {
					const fileName = uri.split("/").pop();
					const match = /\.(\w+)$/.exec(fileName);
					const fileType = match ? `image/${match[1]}` : "image";

					// Use 'cover' field name to match Django model
					formData.append("cover", {
						uri: uri,
						name: fileName || "cover.jpg",
						type: fileType,
					});

					console.log("Adding image to form:", uri);
				}
			}

			// Replace with consistent API_BASE_URL
			const baseUrl = API_BASE_URL;

			// Determine the URL for creating or updating a book - add trailing slash for Django
			const url = editingBook
				? `${baseUrl}/books/${editingBook.id}/` // update existing book
				: `${baseUrl}/books/`; // create new book

			const method = editingBook ? "PUT" : "POST"; // use PUT for updating, POST for creating

			console.log("Submitting to URL:", url, "Method:", method);

			// Improved debugging - log form data entries
			const formDataEntries = [...formData.entries()];
			console.log(
				"Form data entries:",
				formDataEntries.map((entry) => {
					// Don't log the full image data
					if (typeof entry[1] === "object" && entry[0] === "cover") {
						return [entry[0], "Image data (not shown)"];
					}
					return entry;
				})
			);

			let response = await fetch(url, {
				method: method,
				body: formData,
				headers: {
					// Don't specify Content-Type for multipart/form-data
					// React Native will set the boundary automatically
					Accept: "application/json",
				},
			});

			console.log("Response status:", response.status);

			if (!response.ok) {
				// If we get an error / 400 etc
				let errText = "";
				try {
					// Try to parse as JSON first
					const errJson = await response.json();
					errText = JSON.stringify(errJson);
				} catch (jsonError) {
					// If not JSON, get as text
					errText = await response.text();
				}
				console.error("Server response error:", errText);
				throw new Error(`Server error (${response.status}): ${errText}`);
			}

			Alert.alert("Success", "Book saved successfully!");
			// If the request was successful, navigate back with refresh parameter
			navigation.navigate("BookListScreen", { refresh: Date.now() });
		} catch (error) {
			console.error("Error saving book:", error);
			Alert.alert(
				"Network Error",
				"Failed to connect to the server. Please check:\n\n" +
					"1. Your server is running\n" +
					"2. You're connected to the same network\n" +
					"3. The API URL is correct\n\n" +
					"Error details: " +
					error.message
			);
		} finally {
			setUploading(false);
		}
	};

	// Toggle a genre in the selection
	const toggleGenre = (value) => {
		if (genres.includes(value)) {
			setGenres(genres.filter((g) => g !== value));
		} else {
			setGenres([...genres, value]);
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

	// Date picker change handler
	const onDateChange = (event, selectedDate) => {
		const currentDate = selectedDate || publicationDate;
		setShowDatePicker(Platform.OS === "ios");
		setPublicationDate(currentDate);
	};

	// Format date for display
	const formatDate = (date) => {
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
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

	// Simple input change handlers without search functionality
	const handleTitleChange = (text) => {
		setTitle(text);
	};

	const handleAuthorChange = (text) => {
		setAuthor(text);
	};

	// Genre selection logic - improved to handle empty states and defaults
	useEffect(() => {
		if (editingBook && editingBook.genre) {
			const initialGenres = editingBook.genre.split(",").map((g) => g.trim());
			setGenres(initialGenres);
		} else {
			// Default to fiction if no genres are set
			setGenres(["fiction"]);
		}
	}, [editingBook]);

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.label}>Title:</Text>
			<TextInput
				style={styles.input}
				value={title}
				onChangeText={handleTitleChange}
				placeholder="Book title"
			/>

			<Text style={styles.label}>Author:</Text>
			<TextInput
				style={styles.input}
				value={author}
				onChangeText={handleAuthorChange}
				placeholder="Author name(s)"
			/>

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

			{/* Add Vibes field below genres */}
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

			<View style={styles.switchContainer}>
				<Text style={styles.label}>Already Read:</Text>
				<Switch
					value={isRead}
					onValueChange={setIsRead}
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

			<Text style={styles.label}>My thoughts:</Text>
			<TextInput
				style={[styles.input, styles.textArea]}
				value={thoughts}
				onChangeText={setThoughts}
				placeholder="Your personal thoughts on this book..."
				multiline
				numberOfLines={4}
			/>

			<TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
				<Text style={styles.imagePickerText}>
					{coverImage ? "Change Cover Image" : "Pick a Cover Image"}
				</Text>
			</TouchableOpacity>

			{/* If coverImage is set, display the image preview */}
			{coverImage && !coverImage.canceled && (
				<Image
					source={{
						uri:
							coverImage.assets && coverImage.assets.length > 0
								? coverImage.assets[0].uri
								: coverImage.uri,
					}}
					style={styles.imagePreview}
				/>
			)}

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
	pickerContainer: {
		borderColor: "#ccc",
		borderWidth: 1,
		borderRadius: 4,
		marginBottom: 16,
		height: Platform.OS === "ios" ? 150 : 50, // Give more height on iOS
		overflow: "hidden", // Ensure content doesn't spill out
	},
	picker: {
		height: Platform.OS === "ios" ? 150 : 50,
		width: "100%",
	},
	pickerItem: {
		fontSize: 16,
	},
	sectionSpacer: {
		height: 10, // Add extra space between sections
	},
	dateButton: {
		backgroundColor: "#f0f0f0",
		padding: 10,
		borderRadius: 4,
		marginBottom: 24, // Increased bottom margin
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20, // Increased bottom margin
		paddingVertical: 6, // Add some vertical padding
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
	dateButtonText: {
		color: "#007BFF",
		textAlign: "center",
	},
	spacer: {
		height: 60,
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
