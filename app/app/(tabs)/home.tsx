import { View, Dimensions, FlatList, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import Shorts from '@/components/shorts';
import axios from 'axios';
import useAuthStore, { useAuthStoreWithInit } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from Expo

const Home = () => {
  const [viewableIndex, setViewableIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setViewableIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const hasDuplicate = (newPosts, existingPosts) => {
    for (const newPost of newPosts) {
      if (existingPosts.find(post => post.id === newPost.id)) {
        return true;
      }
    }
    return false;
  };

  const fetchVideos = async (isRefresh = false) => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/videos/?page=${page}`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });

      if (isRefresh) {
        setPosts(response.data);
      } else {
        if (!hasDuplicate(response.data, posts)) {
          setPosts(prevPosts => [...response.data, ...prevPosts]);
        }
      }
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setIsRefreshing(false);
    }
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= 0 && !isRefreshing) {
      setIsRefreshing(true);
      setPage(prevPage => prevPage + 1);
      fetchVideos(true);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const { user, loading } = useAuthStoreWithInit();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user]);

  const shareVideo = async (videoUrl) => {
    try {
      const fileUri = `${FileSystem.cacheDirectory}${videoUrl.split('/').pop()}`;
      const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        console.error("Failed to download the video for sharing.");
      }
    } catch (error) {
      console.error("Error sharing video:", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If there are no posts, display a black screen with a refresh button
  if (posts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', marginBottom: 20 }}>No videos available</Text>
        <TouchableOpacity onPress={() => fetchVideos()} style={{ padding: 10, borderWidth: 2, borderColor: 'white', borderRadius: 5 }}>
          <Text style={{ color: 'white' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 1 }}>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Ionicons name="search" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={({ item, index }) => (
          <View>
            <Shorts post={item} isVisible={index === viewableIndex} shareVideo={shareVideo} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={Dimensions.get('window').height}
        snapToAlignment={'start'}
        decelerationRate={'fast'}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item, index) => index.toString()}
        onScroll={handleScroll}
      />
      {isRefreshing && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

export default Home;