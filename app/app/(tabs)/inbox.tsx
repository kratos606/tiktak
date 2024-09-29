import axios from 'axios';
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStoreWithInit } from '@/stores/authStore'; // Use your zustand store
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

const Inbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Separate local loading state
  const { user, loading: authLoading, markNotificationsAsSeen } = useAuthStoreWithInit();

  // Fetch notifications when the user is on the inbox screen
  const fetchNotifications = async () => {
    if (authLoading || !user) return; // Avoid fetching if auth is still loading or user isn't available

    try {
      setIsLoading(true);
      const response = await axios.get(`http://192.168.11.101:8000/api/notifications/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setNotifications(response.data);
      await markAllNotificationsAsSeen(); // Mark them as seen after fetching
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false); // Stop loading after request is done
    }
  };

  // Mark all notifications as seen
  const markAllNotificationsAsSeen = async () => {
    try {
      await axios.post(`http://192.168.11.101:8000/api/notifications/mark-all-seen/`, {}, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      markNotificationsAsSeen(); // Call the zustand method
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  // Only fetch notifications when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [user, authLoading]) // Dependencies ensure it fetches when user is ready
  );

  const formatTimeAgo = (time) => {
    const date = new Date(time);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationText}>
        <Image
          style={{ width: 40, height: 40, borderRadius: 20 }}
          source={item.profile_picture ? { uri: item.profile_picture } : require('../../assets/images/cropped_image.png')}
        />
        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={styles.message}>{item.content}</Text>
          <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        ListEmptyComponent={<Text style={styles.emptyText}>No new notifications</Text>}
      />
    </SafeAreaView>
  );
};

export default Inbox;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  notificationItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  notificationText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginVertical: 20,
  },
});