import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import plusIcon from '../../assets/images/plus-icon.png';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAuthStore, { useAuthStoreWithInit } from '@/stores/authStore';
import axios from 'axios';

const TabLayout = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuthStoreWithInit();
  const { notificationsSeen, resetNotificationsSeen } = useAuthStore((state) => ({
    notificationsSeen: state.notificationsSeen,
    resetNotificationsSeen: state.resetNotificationsSeen,
  }));

  const [unseenNotifications, setUnseenNotifications] = useState(0);

  // Fetch unseen notifications
  const fetchNotifications = async () => {
    if (!user) return; // Avoid fetching if user is not available

    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/notifications/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setNotifications(response.data);
      resetNotificationsSeen(); // Call this to reset unseen count
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, notificationsSeen]); // Fetch whenever user or notificationsSeen changes

  useEffect(() => {
    // Filter unseen notifications
    const unseenCount = notifications.filter(notification => !notification.seen).length;
    setUnseenNotifications(unseenCount);
  }, [notifications]); // Update unseen count whenever notifications change

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#000000", height: 50 },
        tabBarLabelStyle: { marginTop: -5 },
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          tabBarIcon: ({ color }) => <Entypo name='home' size={25} color={color} />,
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarActiveTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name='friend'
        options={{
          tabBarIcon: ({ color }) => <FontAwesome5 name='user-friends' size={25} color={color} />,
          tabBarLabel: 'Friends',
          headerShown: false,
          tabBarActiveTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          headerShown: false,
          tabBarIcon: () => (
            <Image source={plusIcon} style={{ height: 35, resizeMode: 'contain' }} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name='inbox'
        options={{
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialCommunityIcons name='message-minus-outline' size={25} color={color} />
              {unseenNotifications > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: -3,
                    backgroundColor: 'red',
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {unseenNotifications}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarLabel: 'Inbox',
          headerShown: false,
          tabBarActiveTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          tabBarIcon: ({ color }) => <Ionicons name='person-outline' size={25} color={color} />,
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarActiveTintColor: '#fff',
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
