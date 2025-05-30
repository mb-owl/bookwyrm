import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BookshelfScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bookshelf</Text>
            <Text style={styles.subtitle}>Your personal library of books</Text>
            
            {/* Add your bookshelf content here */}
        </View>
    );
}

export default BookshelfScreen;