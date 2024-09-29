import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native'; 
import { AntDesign, Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import useAuthStore from '@/stores/authStore';

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
  followButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fe2858',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  followingButton: {
    backgroundColor: '#e4e4e4', // Color for "Following" state
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

const ProfileIcon = ({picture}) => (
  <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
    <Image 
      source={picture ? {uri : picture} : require('../../assets/images/cropped_image.png')} 
      style={{ width: 120, height: 120, borderRadius:60 }} 
    />
  </View>
);

const ProfileScreen = () => {
  const { id } = useLocalSearchParams(); // Get the user ID from the URL
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null); // Add state for user info
  const [isFollowing, setIsFollowing] = useState(false); // Track follow status

  const user = useAuthStore(state => state.user);

  const fetchUserVideos = async () => {
    try {
      let response = await axios.get(`http://192.168.11.101:8000/api/user/${id}/`, { 
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        }
      });
      setUserInfo(response.data);

      response = await axios.get(`http://192.168.11.101:8000/api/videos/user/${response.data.id}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        }
      });
      setVideos(response.data); // Adjust according to response structure

      // Check if the current user is following this profile
      const followStatus = await axios.get(`http://192.168.11.101:8000/api/follow/status/${id}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        }
      });
      setIsFollowing(followStatus.data.is_following);

    } catch (error) {
      console.error("Error fetching user videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async (userId) => {
    try {
      if (isFollowing) {
        await axios.post(`http://192.168.11.101:8000/api/follow/${userId}/`, {}, {
          headers: {
            Authorization: `Bearer ${user.tokens.access}`,
          }
        });
        setIsFollowing(false);
      } else {
        await axios.post(`http://192.168.11.101:8000/api/follow/${userId}/`, {}, {
          headers: {
            Authorization: `Bearer ${user.tokens.access}`,
          }
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  useEffect(() => {
    fetchUserVideos();
  }, []);

  const router = useRouter();
  const pathname = usePathname()

  if (!userInfo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Directly check and redirect if the condition is met
  if (userInfo?.id === user?.user?.id && pathname === `/profile/${user?.user?.id}`) {
    router.push(`/profile`);
  }


  const renderProfileHeader = () => (
    <>
      <ProfileIcon picture={userInfo.profile_picture} />
      <View style={styles.profileHeader}>
        <Text style={{ padding: 20 }}>@{userInfo.username}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{userInfo.following_count || 0}</Text>
            <Text style={{ color: 'gray', fontSize: 11 }}>Following</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{userInfo.follower_count || 0}</Text>
            <Text style={{ color: 'gray', fontSize: 11 }}>Followers</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{userInfo.heart_count || 0}</Text>
            <Text style={{ color: 'gray', fontSize: 11 }}>Likes</Text>
          </View>
        </View>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton, { flex: 1 }]}
            onPress={() => handleToggleFollow(userInfo.id)}
          >
            <Text style={[styles.followButtonText, isFollowing && { color: 'black' }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} />
        </TouchableOpacity>
        <Text style={styles.text}>{userInfo.username}</Text>
        <View style={{ width: 20 }} />
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          numColumns={3}
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderProfileHeader} // Profile info as the header
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: `/video/${item.id}`, // Navigate to video/id
                params: { userId: userInfo.id } // Pass userInfo.id as a query param
              })}
              style={{ flex: 1 / 3, backgroundColor: 'gray', margin: 1, height: 200 }}
            >
              <Image 
                source={{ uri: item.thumbnail }} // Assuming item.thumbnail is the video thumbnail
                style={{ width: '100%', height: '100%' }} 
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

export default ProfileScreen;