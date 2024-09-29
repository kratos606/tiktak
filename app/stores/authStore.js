import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  notificationsSeen: false, // Add state to track if notifications are seen

  login: async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData)); 
    set({ user: userData, loading: false });
    router.push('/home');
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null });
  },

  setLoading: (loading) => set({ loading }),

  loadUser: async () => {
    set({ loading: true });
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      set({ user: JSON.parse(storedUser), loading: false });
    } else {
      set({ loading: false });
    }
  },

  // Function to mark notifications as seen
  markNotificationsAsSeen: () => set({ notificationsSeen: true }),
  resetNotificationsSeen: () => set({ notificationsSeen: false }),
}));

// Automatically load user when the app starts
export const useAuthStoreWithInit = () => {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser(); 
  }, []);

  return useAuthStore();
};

export default useAuthStore;