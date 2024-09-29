import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import this

const _layout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}  />
        <Stack.Screen name="savePost" options={{ headerShown: false }} />
        <Stack.Screen name="addFriends" options={{ headerShown: false }} />
        <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="followersFollowing" options={{ headerShown: false }} />
        <Stack.Screen name="editProfile" options={{ headerShown: false }} />
        <Stack.Screen name="field" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default _layout;