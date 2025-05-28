import react, { useState, useEffect } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BookListScreen({ route, navigation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("date"); // default sort by date
  const { book } = route.params || {}; // book object passed from list

  useEffect(() => {
    // load cached data from AsyncStorage
    AsyncStorage.getItem("books")
      .then((savedData) => {
        if (savedData) {
          setBooks(JSON.parse(savedData));
        }
      })
      .finally(() => {
        // fetch latest from server after attempting to load cached data
        fetchBooks();
      });
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("BACKEND_URL/api/books");
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
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

  const sortByTitle = () => {
    setSortKey("title");
    // Sort books by title ABC
    const sorted = [...books].sort((a, b) => a.title.localeCompare(b.title));
    setBooks(sorted);
  };

  const sortByDate = () => {
    setSortKey("date");
    // Sort books by date added
    const sorted = [...books].sort(
      (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );
    setBooks(sorted);
  };

  const sortByAuthor = () => {
    setSortKey("author");
    // Sort books by author name
    const sorted = [...books].sort((a, b) => a.author.localeCompare(b.author));
    setBooks(sorted);
  };

  const sortByRating = () => {
    setSortKey("rating");
    // Sort books by rating
    const sorted = [...books].sort((a, b) => b.rating - a.rating);
    setBooks(sorted);
  };

  const sortByGenre = () => {
    setSortKey("genre");
    // Sort books by genre
    const sorted = [...books].sort((a, b) => a.genre.localeCompare(b.genre));
    setBooks(sorted);
  };

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
          // Call API to delete book
          await fetch(`BACKEND_URL/api/books/${book.id}`, { method: "DELETE" });
          // navigate back to book list and refresh state
          navigation.goBack();
        },
      },
    ]);
  };

  const goToEditForm = () => {
    navigation.navigate("BookFormScreen", { book });
  };

  // Navigate to detail screen on item press
  const openBookDetail = (book) => {
    navigation.navigate("BookDetailScreen", { book });
  }; // possible error with BookDetailScreen vs BookDetail (tutorial uses BookDetail)

  const renderBookDetail = () => {
    if (!book) return null;
    
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Title:</Text>
        <Text style={styles.value}>{book.title}</Text>

        <Text style={styles.label}>Author:</Text>
        <Text style={styles.value}>{book.author}</Text>

        {book.cover ? (
          <Image
            source={{ uri: `BACKEND_URL${book.cover}` }}
            style={styles.coverImage}
            accessible={true}
            accessibilityLabel={`Cover image of ${book.title}`}
          />
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

  // Render for FlatList items
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => openBookDetail(item)}
      accessible={true}
      accessibilityLabel={`Book: ${item.title}`}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.author}>{item.author}</Text>
    </TouchableOpacity>
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
      {renderSearchInput()}
      
      <View style={styles.sortRow}>
        <Text style={{ fontFamily: "Georgia" }}>Sort:</Text>
        <TouchableOpacity onPress={sortByTitle}>
          <Text
            style={[
              styles.sortOption,
              sortKey === "title" ? styles.sortSelected : {},
            ]}
          >
            Title
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sortByAuthor}>
          <Text
            style={[
              styles.sortOption,
              sortKey === "author" ? styles.sortSelected : {},
            ]}
          >
            Author
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sortByDate}>
          <Text
            style={[
              styles.sortOption,
              sortKey === "date" ? styles.sortSelected : {},
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
      </View>

      {books.length === 0 ? (
        <Text style={styles.emptyText}>No books added yet.</Text>
      ) : (
        <FlatList
          data={books}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      {/* Add a button to navigate to the book form screen */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BookFormScreen")}
        accessible={true}
        accessibilityLabel="Time to start your next adventure! Add new books here."
      >
        <Text style={styles.buttonText}>Add Book</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 16 },
  label: { fontWeight: "bold", fontSize: 16, fontFamily: "Georgia" },
  value: { fontSize: 16, marginBottom: 8, fontFamily: "Georgia" },
  coverImage: { width: 150, height: 220, marginVertical: 16 },
  noImage: { fontStyle: "italic", color: "#777", marginVertical: 16 },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 24 },
  button: { padding: 12, borderRadius: 4, minWidth: 100, alignItems: "center" },
  editButton: { backgroundColor: "#2196F3" },
  deleteButton: { backgroundColor: "#f44336" },
  buttonText: { color: "#FFF", fontSize: 16 },
  sortRow: { flexDirection: "row", alignItems: "center", padding: 8, justifyContent: 'center' },
  sortOption: { marginHorizontal: 8, color: 'blue' },
  sortSelected: { fontWeight: "bold", textDecorationLine: "underline" },
  searchInput: { borderColor: "#ccc", borderWidth: 1, borderRadius: 4, padding: 8, margin: 8 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  title: { fontSize: 16, fontWeight: "bold" },
  author: { fontSize: 14, color: "#666" },
  emptyText: { textAlign: "center", marginTop: 20, fontStyle: "italic" },
  noCoverText: { fontStyle: "italic", color: "#777", marginVertical: 16 },
});