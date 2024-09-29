import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';  // Import the auth store

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState('');
  const [emailOrUsernameError, setEmailOrUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const login = useAuthStore(state => state.login);

  const handleLogin = async () => {
    setIsLoading(true); // Set loading to true when the login process starts
    setError('');
    setEmailOrUsernameError('');
    setPasswordError('');

    try {
      if (!emailOrUsername || !password) {
        if (!emailOrUsername) setEmailOrUsernameError('Username or email is required.');
        if (!password) setPasswordError('Password is required.');
        return;
      }

      const response = await axios.post('http://192.168.11.101:8000/api/login/', {
        username: emailOrUsername,
        password
      });
      login(response.data);  // Store user data in auth store
      router.push('/home');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false); // Set loading to false once the login process is done
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 20 }}>
          Log in
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Email or username
          </Text>
          {emailOrUsernameError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{emailOrUsernameError}</Text>
            </View>
          ) : null}
          <TextInput
            style={[styles.input, emailOrUsernameError ? styles.inputError : null]}
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
          />
        </View>

        <View style={{ width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Password
          </Text>
          {passwordError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}  // Use the handleLogin function here
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              Log in
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text>
          Don't have an account?
        </Text>
        <Link href={'/signup'}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    marginBottom: 20,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 10,
    borderColor: '#cccccc',  // Default border color
    borderWidth: 1,  // Ensure border width is set
    borderRadius: 5,
  },
  inputError: {
    borderColor: 'red',  // Red border for errors
  },
  button: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fd3e3e',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
  errorContainer: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  signUpLink: {
    color: '#fd3e3e',
  },
});

export default Login;
