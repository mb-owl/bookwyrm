import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Platform, View, Text } from "react-native";

// Import API configuration safely
import * as apiConfig from "./utils/apiConfig";
const getApiEndpoint = apiConfig.getApiEndpoint || ((path) => `http://localhost:8000/api/${path || ""}`);

// Import screens directly instead of using dynamic require
import WelcomeScreen from "./screens/welcome";
import BookListScreen from "./screens/booklistscreen";
import BookDetailScreen from "./screens/bookdetailscreen";
import BookFormScreen from "./screens/bookformscreen";
import FavoritesScreen from "./screens/favorites";
import TrashScreen from "./screens/trashscreen";

// Create error wrapper component for screen components
const withErrorBoundary = (ScreenComponent, screenName) => {
  return (props) => {
    try {
      return <ScreenComponent {...props} />;
    } catch (error) {
      console.error(`Error rendering ${screenName}:`, error);
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "red" }}>Error loading screen</Text>
          <Text>{error.message}</Text>
        </View>
      );
    }
  };
};

// Wrap each screen with error boundary
const SafeWelcomeScreen = withErrorBoundary(WelcomeScreen, "WelcomeScreen");
const SafeBookListScreen = withErrorBoundary(BookListScreen, "BookListScreen");
const SafeBookDetailScreen = withErrorBoundary(BookDetailScreen, "BookDetailScreen");
const SafeBookFormScreen = withErrorBoundary(BookFormScreen, "BookFormScreen");
const SafeFavoritesScreen = withErrorBoundary(FavoritesScreen, "FavoritesScreen");
const SafeTrashScreen = withErrorBoundary(TrashScreen, "TrashScreen");

const Stack = createNativeStackNavigator();

// Check server connectivity
const checkServerConnection = async () => {
  try {
    // Use the books endpoint which definitely exists
    const endpoint = getApiEndpoint("books");
    console.log("Checking server connection to:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    console.log("Server check response status:", response.status);

    if (response.ok) {
      console.log("Server connection successful");
    } else {
      console.error("Server returned error:", response.status);
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Server connection error:", error);
    // Log the error but don't show alert on startup
    console.warn(`Could not connect to the server. Error: ${error.message}`);
  }
};

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize app and handle errors gracefully
    const initApp = async () => {
      try {
        // Small delay before checking server connectivity
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await checkServerConnection();
      } catch (error) {
        console.warn("App initialization error:", error);
      } finally {
        setAppReady(true);
      }
    };

    initApp();
  }, []);

  // Show a loading screen while initializing
  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading BookWyrm...</Text>
      </View>
    );
  }

  // Add an error boundary
  try {
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="WelcomeScreen"
          screenOptions={{ gestureEnabled: false }}
        >
          <Stack.Screen
            name="WelcomeScreen"
            component={SafeWelcomeScreen}
            options={{
              title: "Welcome to BookWyrm",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="BookListScreen"
            component={SafeBookListScreen}
            options={{ title: "Book List" }}
          />
          <Stack.Screen
            name="BookDetailScreen"
            component={SafeBookDetailScreen}
            options={{ title: "Book Details" }}
          />
          <Stack.Screen
            name="BookFormScreen"
            component={SafeBookFormScreen}
            options={{ title: "Add/Edit Book" }}
          />
          <Stack.Screen
            name="Favorites"
            component={SafeFavoritesScreen}
            options={{ title: "Favorite Books" }}
          />
          <Stack.Screen
            name="Trash"
            component={SafeTrashScreen}
            options={{ title: "Recently Deleted" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    // Provide a fallback UI in case of error
    console.error("Fatal error in App component:", error);
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          BookWyrm encountered an error
        </Text>
        <Text style={{ marginBottom: 20, textAlign: "center" }}>
          There was a problem loading the application. Please restart the app.
        </Text>
        <Text style={{ fontSize: 12, color: "#666" }}>
          Error details: {error.message || "Unknown error"}
        </Text>
      </View>
    );
  }
}
