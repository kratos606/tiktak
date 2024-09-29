import useAuthStore from '@/stores/authStore';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddFriends = () => {
  const [friends, setFriends] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Friends');

  const user = useAuthStore((state) => state.user);

  const fetchSuggested = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/users/suggested/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setSuggestedFriends(response.data);
    } catch (error) {
      console.error('Error fetching suggested friends:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/users/friends/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleToggleFollow = async (id) => {
    const isFollowing = friends.some((friend) => friend.id === id);

    if (isFollowing) {
      // Unfollow case: remove from friends
      setFriends((prevFriends) => prevFriends.filter((friend) => friend.id !== id));
      try {
        await axios.post(
          `http://192.168.11.101:8000/api/follow/${id}/`, // Unfollow endpoint
          {},
          {
            headers: {
              Authorization: `Bearer ${user.tokens.access}`,
            },
          }
        );
      } catch (error) {
        console.error('Error unfollowing:', error);
      }
    } else {
      // Follow case: add to friends
      const friendToAdd = suggestedFriends.find((suggested) => suggested.id === id);
      if (friendToAdd) {
        setFriends((prevFriends) => [...prevFriends, friendToAdd]);
      }
      try {
        await axios.post(
          `http://192.168.11.101:8000/api/follow/${id}/`, // Follow endpoint
          {},
          {
            headers: {
              Authorization: `Bearer ${user.tokens.access}`,
            },
          }
        );
      } catch (error) {
        console.error('Error following:', error);
      }
    }
  };

  useEffect(() => {
    fetchSuggested();
    fetchFriends();
  }, []);

  const renderItem = ({ item }) => {
    const isFollowing = friends.some((friend) => friend.id === item.id);

    return (
      <View style={styles.friendContainer}>
        <Image source={item && item.profile_picture ? {uri : item.profile_picture} : require('../assets/images/cropped_image.png')} style={styles.avatar} />
        <View style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Text style={styles.friendName}>{item.username}</Text>
          <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton, { flex: 1 }]}
              onPress={() => handleToggleFollow(item.id)}
            >
              <Text style={[styles.followButtonText, isFollowing && { color: 'black' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            {!isFollowing && (
              <TouchableOpacity
                style={[styles.removeButton, { flex: 1 }]}
                onPress={() => console.log('Remove pressed')} // Placeholder for any remove action
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderList = () => {
    const data = selectedTab === 'Friends' ? friends : suggestedFriends;
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Add Friends</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Friends' && styles.activeTab]}
          onPress={() => setSelectedTab('Friends')}
        >
          <Text style={styles.tabText}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Suggested' && styles.activeTab]}
          onPress={() => setSelectedTab('Suggested')}
        >
          <Text style={styles.tabText}>Suggested</Text>
        </TouchableOpacity>
      </View>
      {renderList()}
    </SafeAreaView>
  );
};

export default AddFriends;

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
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendName: {
    fontSize: 18,
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
  removeButton: {
    backgroundColor: '#e4e4e4',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});