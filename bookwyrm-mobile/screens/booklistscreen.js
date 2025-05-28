import react, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';


export default function BookListScreen({ route, navigation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const {book} = route.params; //book object passed from list // Get book from params if available

  const handleDelete = async () => { //confirm delete book
    Alert.alert(
        'Delete Book',
        'Are you sure you want to delete this book?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // Call API to delete book
              await fetch(`http://127.0.0.1:8000/api/books/${book.id}`, { method: 'DELETE' });
              // navigate back to book list and refresh state
              navigation.goback();
            }
          },
        ],
      );
    };

    const goToEditForm = () => {
      navigation.navigate('BookFormScreen', { book }); // Navigate to form with book data to edit
    };

    return (
      <View style={styles.container}>
        <Text style={styles.label}>Title:</Text> 
        <Text style={styles.value}>{book.title}</Text>

        <Text style={styles.label}>Author:</Text>
        <Text style={styles.value}>{book.author}</Text>

        {book.cover ? (
          <Image
            source={{ uri: 'http://127.0.0.1:8000${book.cover}'}}
            style={styles.coverImage}
            accessible={true}
            accessibilityLabel={`Cover image of ${book.title}`}
          />
        ) : (
          <Text style={styles.noCoverText}>No cover image available</Text>
        )}

{/* Add buttons for edit and delete */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={goToEditForm}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  

  //fetch books from API
  useEffect(() => {
    fetchBooks();
  }
  , []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let response = await fetch('https://api.example.com/books');
      let data = await response.json();
      setBooks(data);
    }
    catch (error) {
      console.error('Sorry, cannot fetch books at this time.', error);
      //TO DO - IN REAL APP, LOAD CACHED DATA FROM ASYNC STORAGE IF OFFLINE
    }
    finally {
      setLoading(false);
    }
  };

// Navigate to detail screen on item press

const openBookDetail = (book) => {
    navigation.navigate('BookDetailScreen', { book });
}; // possible error with BookDetailScreen vs BookDetail (tutorial uses BookDetail)

// Render each book item

  // Render for FlatList items
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => openBookDetail(item)}
                      accessible={true} accessibilityLabel={`Book: ${item.title}`}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.author}>{item.author}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
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
          style={styles.addButton}
          onPress={() => navigation.navigate('BookFormScreen')}
          accessible={true}
          accessibilityLabel="Time to start your next adventure! Add new books here."
        />
        </View>
    );


// Styles for the BookListScreen


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 16 },
  label: { fontWeight: 'bold', fontSize: 16, fontFamily: 'Georgia' },
  value: { fontSize: 16, marginBottom: 8, fontFamily: 'Georgia' },
  coverImage: { width: 150, height: 220, marginVertical: 16 },
  noImage: { fontStyle: 'italic', color: '#777', marginVertical: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  button: { padding: 12, borderRadius: 4, minWidth: 100, alignItems: 'center' },
  editButton: { backgroundColor: '#2196F3' },
  deleteButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#FFF', fontSize: 16 }
});


