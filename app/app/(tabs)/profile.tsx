import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore, { useAuthStoreWithInit } from '@/stores/authStore'; // Adjust the path according to your setup
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import * as Clipboard from 'expo-clipboard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: 'lightgray',
  },
  text: {
    fontSize: 16,
    color: 'black',
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 65,
    borderBottomWidth: 1,
    borderColor: 'lightgray',
  },
  statsContainer: {
    paddingBottom: 20,
    flexDirection: 'row',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#e4e4e4',
  },
});

const ProfileIcon = ({ picture }) => (
  <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
    <Image
      source={picture ? { uri: picture } : require('../../assets/images/cropped_image.png')}
      style={{ width: 120, height: 120, borderRadius: 60 }}
    />
  </View>
);

const Profile = () => {
  const logout = useAuthStore((state) => state.logout);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  const fetchUserVideos = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/videos/user/${user.user.id}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setVideos(response.data);
      setUserInfo(response.data.userInfo);
    } catch (error) {
      console.error("Error fetching user videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        setIsLoading(true);  // Reset loading state
        setVideos([]);       // Clear videos before refetching
        fetchUserVideos();
      }
    }, [user])
  );
  

  const { user, loading } = useAuthStoreWithInit();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const shareProfile = () => {
    const profileUrl = `exp://192.168.11.101:8081/--/profile/${user.user.id}`;
    Clipboard.setString(profileUrl);
    alert('Profile URL copied to clipboard');
  };

  const renderProfileHeader = () => (
    <>
      <ProfileIcon picture={user.user.profile_picture} />
      <View style={styles.profileHeader}>
        <Text style={{ padding: 20 }}>@{user.user.username}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => router.push({
              pathname: '/followersFollowing',
              params: { userId: user.user.id, type: 'Following' },
            })}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.user.following_count || 0}</Text>
              <Text style={{ color: 'gray', fontSize: 11 }}>Following</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsItem}>
            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => router.push({
              pathname: '/followersFollowing',
              params: { userId: user.user.id, type: 'Followers' },
            })}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.user.follower_count || 0}</Text>
              <Text style={{ color: 'gray', fontSize: 11 }}>Followers</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsItem}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.user.heart_count || 0}</Text>
            <Text style={{ color: 'gray', fontSize: 11 }}>Likes</Text>
          </View>
        </View>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/editProfile')}>
            <Text style={{ color: 'black', fontWeight: '500', fontSize: 13 }}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={shareProfile}>
            <Text style={{ color: 'black', fontWeight: '500', fontSize: 13 }}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/addFriends')}>
            <AntDesign name="adduser" size={25} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Feather name="search" size={20} />
        </TouchableOpacity>
        <Text style={styles.text}>{user.user.username}</Text>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={24} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          numColumns={3}
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderProfileHeader}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: `/video/${item.id}`,
                params: { userId: user.user.id }
              })}
              style={{ flex: 1 / 3, backgroundColor: 'gray', margin: 1, height: 200 }}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: '100%', height: '100%' }}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;