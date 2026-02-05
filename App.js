import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MenuDashboard from './src/screens/MenuDashboard';

// Κρατάμε το Native Splash visible μέχρι να είμαστε έτοιμοι
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#121212',
    secondary: '#333333',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Ξεκινάει με Opacity 1 (Φαίνεται)

  useEffect(() => {
    async function prepare() {
      try {
        // Εδώ θα μπορούσαμε να φορτώσουμε γραμματοσειρές ή δεδομένα
        // Προς το παρόν απλά περιμένουμε λίγο για να φανεί το εφέ
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Όταν το App είναι έτοιμο, κρύβουμε το Native Splash και ξεκινάμε το Fade Out
  useEffect(() => {
    if (appIsReady) {
      // 1. Κρύβουμε το στατικό εικονίδιο του Expo
      SplashScreen.hideAsync();

      // 2. Ξεκινάμε το animation εξαφάνισης της μαύρης οθόνης
      Animated.timing(fadeAnim, {
        toValue: 0,       // Πάει στο 0 (αόρατο)
        duration: 800,    // Διαρκεί 800ms (Smooth)
        useNativeDriver: true,
      }).start();
    }
  }, [appIsReady]);

  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1 }}>
        
        {/* Η Κυρίως Εφαρμογή */}
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="MenuDashboard" 
              component={MenuDashboard} 
              options={{ headerShown: false }} 
            />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Το Custom Splash Screen που κάθεται ΠΑΝΩ από την εφαρμογή */}
        <Animated.View 
          style={[
            styles.splashContainer, 
            { opacity: fadeAnim }, // Το δένουμε με το animation
            { pointerEvents: appIsReady ? 'none' : 'auto' } // Όταν τελειώσει, να μην εμποδίζει τα κλικ
          ]}
        >
          <Text style={styles.splashText}>MENU{"\n"}ADMINISTRATION</Text>
          <Text style={styles.splashSubText}>POWERED BY THERISTIS</Text>
        </Animated.View>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject, // Πιάνει όλη την οθόνη
    backgroundColor: '#121212',       // Μαύρο φόντο
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,                     // Είναι πάνω από όλα
  },
  splashText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,                 // Αραιά γράμματα για style
    lineHeight: 40
  },
  splashSubText: {
    color: '#666666',
    fontSize: 10,
    marginTop: 20,
    letterSpacing: 2,
    position: 'absolute',
    bottom: 50
  }
});