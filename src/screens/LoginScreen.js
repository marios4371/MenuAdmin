import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { api } from '../services/api';

const COLORS = {
  primary: '#121212',
  background: '#F4F4F4',
};

export default function LoginScreen({ navigation }) {
  const [shopId, setShopId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!shopId || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await api.login(shopId, password);
    setLoading(false);
    if (result.success) {
      navigation.replace('MenuDashboard', { shopId, password });
    } else {
      Alert.alert('Login Failed', 'Wrong Shop ID or Password');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>MENU MANAGER</Text>
          <Text style={styles.subtitle}>Sign in to your dashboard</Text>

          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <TextInput
                label="SHOP ID"
                value={shopId}
                onChangeText={setShopId}
                mode="outlined"
                dense
                style={styles.input}
                autoCapitalize="none"
                activeOutlineColor={COLORS.primary}
              />
              <TextInput
                label="PASSWORD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                dense
                style={styles.input}
                activeOutlineColor={COLORS.primary}
              />

              <Button 
                mode="contained" 
                onPress={handleLogin} 
                loading={loading}
                style={styles.button}
                buttonColor={COLORS.primary}
              >
                LOGIN
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 20 },
  title: { textAlign: 'center', marginBottom: 5, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  subtitle: { textAlign: 'center', marginBottom: 30, color: '#666', fontSize: 12 },
  card: { backgroundColor: 'white', borderRadius: 4 },
  input: { marginBottom: 15, backgroundColor: '#fff' },
  button: { marginTop: 10, borderRadius: 4, paddingVertical: 4 }
});