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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function BookFormScreen({ route, navigation }) {
    const editingBook = route.params?.book; // Added missing route parameter
    const [title, setTitle] = useState(editingBook ? editingBook.title : "");
    const [author, setAuthor] = useState(editingBook ? editingBook.author : "");
    const [coverImage, setCoverImage] = useState(
        editingBook ? editingBook.coverImage : null
    );
    const [isLoading, setUploading] = useState(false);

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
			if (coverImage && !coverImage.canceled) {
				//append the image file to the form data if selected
				const uri = coverImage.uri;
				const fileName = uri.split("/").pop();
				const match = /\.(\w+)$/.exec(fileName);
				const fileType = match ? `image/${match[1]}` : "image";
				formData.append("coverImage", {
					uri: uri,
					name: fileName || "cover.jpg",
					//default name if fileName is not available
					type: fileType,
				});
			}

			const url = editingBook
				? `BACKEND_URL/api/books/${editingBook.id}` //update existing book
				: `BACKEND_URL/api/books/`; //create new book

			const method = editingBook ? "PUT" : "POST"; //use PUT for updating, POST for creating
			let response = await fetch(url, {
				method: method,
				body: formData,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			if (!response.ok) {
				// If we get an error / 400 etc
				let errText = await response.text();
				throw new Error(errText);
			}
            // If the request was successful, navigate back
            navigation.navigate("BookList"); // Updated to match Stack.Screen name
        } catch (error) {
			console.error("Error saving book:", error);
			Alert.alert(
				"We had an issue adding this book to your bookshelves. Please try again."
			);
		} finally {
			setUploading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Title:</Text>
			<TextInput
				style={styles.input}
				value={title}
				onChangeText={setTitle}
				placeholder="Book title"
			/>
			<Text style={styles.label}>Author:</Text>
			<TextInput
				style={styles.input}
				value={author}
				onChangeText={setAuthor}
				placeholder="Author name(s)"
			/>
			<TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
				<Text style={styles.imagePickerText}>
					{coverImage ? "Change Cover Image" : "Pick a Cover Image"}
				</Text>
			</TouchableOpacity>

			{/* If coverImage is set, display the image preview */}
			{coverImage && !coverImage.canceled && (
				<Image source={{ uri: coverImage.uri }} style={styles.imagePreview} />
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
		</View>
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
	},
	input: {
		height: 40,
		borderColor: "#ccc",
		borderWidth: 1,
		marginBottom: 16,
		paddingHorizontal: 10,
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
	},
});
