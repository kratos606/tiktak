import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useAuthStore from '@/stores/authStore';

const FollowersFollowing = () => {
  const { userId, type } = useLocalSearchParams(); // Retrieve userId and type from the route parameters
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(type || 'Followers'); // Use type to set the initial tab
  const [followingList, setFollowingList] = useState([]); // To track users currently being followed

  const user = useAuthStore(state => state.user);
  const router = useRouter();

  const fetchFollowStatus = async (userIdToCheck) => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/follow/status/${userIdToCheck}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      return response.data.is_following; // Assuming the API returns { isFollowing: true/false }
    } catch (error) {
      console.error('Error fetching follow status:', error);
      return false;
    }
  };

  const fetchData = async (type) => {
    setIsLoading(true); // Start loading when switching tabs
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/users/${userId}/${type.toLowerCase()}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });

      // Fetch follow status for each user
      const updatedData = await Promise.all(response.data.map(async (user) => {
        const isFollowing = type === 'Followers' ? await fetchFollowStatus(user.id) : true;
        return { ...user, isFollowing };
      }));

      setData(updatedData); // Set followers or following data based on the tab
      if (type === 'Following') {
        setFollowingList(response.data.map(user => user.id)); // Store list of IDs of users being followed
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowBack = async (userIdToFollow) => {
    try {
      await axios.post(
        `http://192.168.11.101:8000/api/follow/${userIdToFollow}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.tokens.access}`,
          },
        }
      );
      // Update local state
      setFollowingList(prevList => [...prevList, userIdToFollow]);
      setData(prevData => 
        prevData.map(user => 
          user.id === userIdToFollow ? { ...user, isFollowing: true } : user
        )
      );
    } catch (error) {
      console.error('Error following back:', error);
    }
  };

  const handleUnfollow = async (userIdToUnfollow) => {
    try {
      await axios.post(
        `http://192.168.11.101:8000/api/follow/${userIdToUnfollow}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.tokens.access}`,
          },
        }
      );
      // Update local state
      setData(prevData => prevData.filter(user => user.id !== userIdToUnfollow));
      setFollowingList(prevList => prevList.filter(id => id !== userIdToUnfollow));
    } catch (error) {
      console.error('Error unfollowing:', error);
    }
  };

  useEffect(() => {
    fetchData(selectedTab);
  }, [selectedTab]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>{selectedTab}</Text>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Followers' && styles.activeTab]}
          onPress={() => setSelectedTab('Followers')}
        >
          <Text style={styles.tabText}>Followers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Following' && styles.activeTab]}
          onPress={() => setSelectedTab('Following')}
        >
          <Text style={styles.tabText}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* List of Followers or Following */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => router.push(`/profile/${item.id}`)}>
                <Image source={item && item.profile_picture ? {uri : item.profile_picture} : require('../assets/images/cropped_image.png')} style={styles.avatar} />
                <Text style={styles.username}>{item.username}</Text>
                {selectedTab === 'Following' ? (
                <TouchableOpacity
                  style={styles.unfollowButton}
                  onPress={() => handleUnfollow(item.id)}
                >
                  <Text style={styles.unfollowButtonText}>Unfollow</Text>
                </TouchableOpacity>
              ) : (
                !item.isFollowing && ( // Only show "Follow Back" button if not following back
                  <TouchableOpacity
                    style={styles.followBackButton}
                    onPress={() => handleFollowBack(item.id)}
                  >
                    <Text style={styles.followBackButtonText}>Follow Back</Text>
                  </TouchableOpacity>
                )
              )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default FollowersFollowing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'regular',
    marginVertical: 20,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  tabButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  tabText: {
    fontSize: 16,
    color: 'black',
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: 'lightgray',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    alignSelf: 'center',
  },
  unfollowButton: {
    backgroundColor: '#e4e4e4',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  followBackButton: {
    backgroundColor: '#fe2858',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
