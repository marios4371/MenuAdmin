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

// Χρησιμοποιούμε Dark Theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ffffff',
    background: '#121212',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Περιμένουμε 2.5 δευτερόλεπτα
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      const transition = async () => {
        await SplashScreen.hideAsync();
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start();
      };
      transition();
    }
  }, [appIsReady]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#fff' }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MenuDashboard" component={MenuDashboard} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* --- CUSTOM INTRO SCREEN --- */}
        <Animated.View 
          style={[
            styles.splashContainer, 
            { opacity: fadeAnim },
            { pointerEvents: fadeAnim._value === 0 ? 'none' : 'auto' } 
          ]}
        >
          <Text style={styles.splashTitle}>MENU</Text>
          <Text style={styles.splashSubtitle}>ADMINISTRATOR</Text>
          
          {/* ΔΙΟΡΘΩΣΗ ΕΔΩ: Κλείνουμε σωστά το View */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>POWERED BY THERISTIS</Text>
          </View>

        </Animated.View>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
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