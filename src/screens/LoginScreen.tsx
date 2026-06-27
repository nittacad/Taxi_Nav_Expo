import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing, Fonts } from '../constants/theme';

interface LoginScreenProps {
  onLogin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // モック実装: ログインボタン押下で次画面へ
    if (onLogin) {
      onLogin();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Taxi Nav</Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.backgroundSelected,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.backgroundSelected,
              },
            ]}
            placeholder="Enter your password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.text }]}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={[styles.loginButtonText, { color: theme.background }]}>
            ログイン
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: Spacing.five,
    textAlign: 'center',
    fontFamily: Fonts?.sans,
  },
  inputContainer: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.two,
    fontFamily: Fonts?.sans,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts?.sans,
  },
});
