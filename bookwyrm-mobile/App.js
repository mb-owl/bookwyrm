import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

//screens
import booklistscreen from './screens/booklistscreen';
import bookdetailscreen from './screens/bookdetailscreen';
import bookformscreen from './screens/bookformscreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BookStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BookListScreen"
        component={booklistscreen}
        options={{ title: 'Book List' }}
      />
      <Stack.Screen
        name="BookDetailScreen"
        component={bookdetailscreen}
        options={{ title: 'Book Details' }}
      />
      <Stack.Screen
        name="BookFormScreen"
        component={bookformscreen}
        options={{ title: 'Add/Edit Book' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Books') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'AddBook') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            }
            return <ionicons name={iconName} size={size} color={color} />;
          },
          tabBarInactiveTintColor: 'gray',
          tabBarActiveBackgroundColor: '#f0f0f0',
          tabBarActiveTintColor: 'magenta',
        })}
      >
        <Tab.Screen name="Books" component={BookStack} />
        <Tab.Screen name="AddBook" component={bookformscreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}