import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const setLoading = useAuthStore(state => state.setLoading);
  const login = useAuthStore(state => state.login);

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    try {
      if (!username || !email || !password) {
        if (!username) setUsernameError('Username is required.');
        if (!email) setEmailError('Email is required.');
        if (!password) setPasswordError('Password is required.');
        return;
      }

      const response = await axios.post('http://192.168.11.101:8000/api/register/', {
        username: username,
        email: email,
        password: password
      });
      login(response.data);  // Store user data in auth store
      router.push('/home');
    } catch (error) {
      console.error('Sign up failed:', error);
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 20 }}>
          Sign up
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Username
          </Text>
          {usernameError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{usernameError}</Text>
            </View>
          ) : null}
          <TextInput
            style={[styles.input, usernameError ? styles.inputError : null]}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={{ width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Email
          </Text>
          {emailError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
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
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              Sign up
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text>
          Already have an account?
        </Text>
        <Link href={'/login'}>
          <Text style={styles.signUpLink}>Log In</Text>
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
    borderColor: '#cccccc', // Default border color
    borderWidth: 1, // Ensure border width is set
    borderRadius: 5,
  },
  inputError: {
    borderColor: 'red', // Red border for errors
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

export default SignUp;