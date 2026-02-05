import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MenuDashboard from './src/screens/MenuDashboard';

// Κρατάμε το Native Splash visible μέχρι να είμαστε έτοιμοι
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// Χρησιμοποιούμε Dark Theme για να ταιριάζει
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ffffff', // Λευκά στοιχεία
    background: '#121212', // Μαύρο φόντο
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Ξεκινάει ορατό (Opacity 1)

  useEffect(() => {
    async function prepare() {
      try {
        // Εδώ περιμένουμε 2.5 δευτερόλεπτα. Σε αυτό το διάστημα,
        // ο χρήστης βλέπει το Native Splash Screen που είναι μαύρο.
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Δηλώνουμε ότι η εφαρμογή είναι έτοιμη
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Μόλις είμαστε έτοιμοι:
      const transition = async () => {
        // 1. Κρύβουμε το Native Splash. Επειδή το δικό μας custom view
        // από κάτω είναι ΙΔΙΟ (μαύρο), η αλλαγή είναι αόρατη.
        await SplashScreen.hideAsync();

        // 2. Ξεκινάμε το Fade Out του δικού μας view
        Animated.timing(fadeAnim, {
          toValue: 0,      // Πάει σε διαφάνεια 0
          duration: 800,   // Μέσα σε 0.8 δευτερόλεπτα
          useNativeDriver: true,
        }).start();
      };
      transition();
    }
  }, [appIsReady]);

  return (
    <PaperProvider theme={theme}>
      {/* Ρυθμίζουμε την μπάρα κατάστασης του κινητού να είναι ανοιχτόχρωμη */}
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#fff' }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MenuDashboard" component={MenuDashboard} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* --- CUSTOM INTRO SCREEN --- */}
        {/* Αυτό κάθεται ΠΑΝΩ από όλα μέχρι να εξαφανιστεί */}
        <Animated.View 
          style={[
            styles.splashContainer, 
            { opacity: fadeAnim },
            // Όταν η διαφάνεια γίνει 0, σταματάμε να δεχόμαστε κλικ
            { pointerEvents: fadeAnim._value === 0 ? 'none' : 'auto' } 
          ]}
        >
          <Text style={styles.splashTitle}>MENU</Text>
          <Text style={styles.splashSubtitle}>ADMINISTRATOR</Text>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>POWERED BY THERISTIS</Text>
          </Animated.View>
        </Animated.View>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject, // Πιάνει όλη την οθόνη
    backgroundColor: '#121212',       // ΑΠΟΛΥΤΟ ΜΑΥΡΟ
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,                     // Πάντα στην κορυφή
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 4,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: '#666666',
    fontSize: 10,
    letterSpacing: 2,
  }
});