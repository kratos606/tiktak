import { useAuthStoreWithInit } from '@/stores/authStore';
import { useRouter, useRootNavigationState } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';

const Index = () => {
  const { user, loading } = useAuthStoreWithInit();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;  // Wait for navigation to be ready

    if (!loading) {  // Only attempt navigation if loading is false
      if (!user) {
        router.replace('/login');
      } else {
        router.replace('/home');
      }
    }
  }, [loading, user, navigationState?.key, router]);  // Ensure dependencies are stable

  if (loading || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/tiktok.png')} 
        style={styles.image} 
      />
      <Text style={styles.text}>
        TikTok
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  image: {
    height: '15%',
    resizeMode: 'contain',
  },
  text: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default Index;