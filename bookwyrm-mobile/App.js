import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//screens
import booklistscreen from './screens/booklistscreen';
import bookdetailscreen from './screens/bookdetailscreen';
import bookformscreen from './screens/bookformscreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BookListScreen">
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
    </NavigationContainer>
  );
}