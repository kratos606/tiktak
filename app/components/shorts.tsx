import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Alert, FlatList, TextInput, KeyboardAvoidingView } from 'react-native';
import { Video } from 'expo-av';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import here

const Shorts = ({ post, isVisible, shareVideo }) => {
  const [paused, setPaused] = useState(!isVisible);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [userInfo, setUserInfo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [followStatus, setFollowStatus] = useState(false)
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const isFocused = useIsFocused();

  const bottomSheetRef = useRef(null);
  const snapPoints = ['50%'];

  const [commentModalOpen,setCommentModalOpen] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setPaused(!isFocused || !isVisible);
      return () => {
        setPaused(true);
      };
    }, [isFocused, isVisible])
  );

  useEffect(() => {
    fetchLikedStatus();
    fetchUserInfo();
    fetchComments();
    fetchFollowStatus()
  }, []);

  const fetchLikedStatus = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/like/${post.id}/status/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setLiked(response.data.liked);
    } catch (error) {
      console.error('Error fetching liked status:', error);
      handleError(error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/user/${post.user}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      handleError(error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/videos/${post.id}/comments/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      handleError(error);
    }
  };

  const handleError = (error) => {
    if (error.response && error.response.status === 401) {
      Alert.alert('Unauthorized', 'Your session has expired. Please log in again.');
    } else {
      Alert.alert('Error', 'An error occurred while fetching data.');
    }
  };

  const toggleLike = async () => {
    const newLikedStatus = !liked;
    setLiked(newLikedStatus);
    setLikeCount(likeCount + (newLikedStatus ? 1 : -1));

    try {
      await axios.post(`http://192.168.11.101:8000/api/like/${post.id}/`, {}, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
    } catch (error) {
      setLiked(!newLikedStatus);
      setLikeCount(likeCount + (newLikedStatus ? -1 : 1));
      handleError(error);
    }
  };

  const fetchFollowStatus = async () => {
    try {
      const response = await axios.get(`http://192.168.11.101:8000/api/follow/status/${post.user}/`, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setFollowStatus(response.data.is_following);
      console.log(response.data.is_following)
    } catch (error) {
      console.error('Error fetching comments:', error);
      handleError(error);
    }
  }

  const postComment = async () => {
    try {
      await axios.post(`http://192.168.11.101:8000/api/comment/${post.id}/`, 
      { text: newComment }, {
        headers: {
          Authorization: `Bearer ${user.tokens.access}`,
        },
      });
      setNewComment('');
      fetchComments(); // Refresh comments after posting
    } catch (error) {
      console.error('Error posting comment:', error);
      handleError(error);
    }
  };

  const handleFollow = async () => {
    try {
        await axios.post(`http://192.168.11.101:8000/api/follow/${post.user}/`, {}, {
          headers: {
            Authorization: `Bearer ${user.tokens.access}`,
          }
        });
        fetchFollowStatus()
    }
    catch(error){
      console.log(error)
    }
  }

  const onPlayPausePress = () => {
    setPaused(!paused);
    setCommentModalOpen(false)
  };

  useEffect(() => {
    if(commentModalOpen && bottomSheetRef.current){
      bottomSheetRef.current.expand()
    }
    else{
      bottomSheetRef.current && bottomSheetRef.current.close()
    }
  },[commentModalOpen])

  return (
    <View style={styles.container}>
      <StatusBar barStyle={'light-content'} />

      <TouchableWithoutFeedback onPress={onPlayPausePress}>
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: post.video_file }}
            style={styles.video}
            resizeMode="cover"
            isLooping
            shouldPlay={!paused && isFocused && isVisible}
          />
          {paused && (
            <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -25 }, { translateY: -25 }] }} >
              <FontAwesome5 name="play" size={50} color="white" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.bottomSection}>
        <View style={styles.bottomLeftSection}>
          {userInfo ? ( // Check if userInfo is not null
            <>
              <Text style={styles.channelName}>{userInfo.username}</Text>
              <Text style={styles.caption}>{post.description}</Text>
            </>
          ) : (
            <Text style={styles.channelName}>Loading...</Text> // Placeholder while loading
          )}
        </View>
      </View>

      <View style={styles.verticalBar}>
        <View style={[styles.verticalBarItem, styles.avatarContainer]}>
          <TouchableOpacity onPress={() => router.push(`/profile/${post.user}`)}>
            <Image
              style={styles.avatar}
              source={userInfo && userInfo.profile_picture ? { uri: userInfo.profile_picture } : require('../assets/images/cropped_image.png')} // Use placeholder if profile picture is not available
            />
          </TouchableOpacity>
          {
            (userInfo?.id !== user?.user?.id && !followStatus) && 
            (
              <TouchableOpacity onPress={handleFollow} style={{alignItems:'center'}}>
                <View style={styles.followButton}>
                  <Image source={require('../assets/images/plus-button.png')} style={styles.followIcon} />
                </View>
              </TouchableOpacity>
            )
          }
        </View>
        <View style={styles.verticalBarItem}>
          <TouchableOpacity onPress={toggleLike}>
            <FontAwesome5
              name={liked ? 'heart' : 'heart'}
              size={32}
              solid={true}
              color={liked ? 'red' : 'white'}
            />
          </TouchableOpacity>
          <Text style={styles.verticalBarText}>{likeCount}</Text>
        </View>
        <View style={styles.verticalBarItem}>
          <TouchableOpacity onPress={() => setCommentModalOpen(true)}>
            <Image style={styles.verticalBarIcon} source={require('../assets/images/message-circle.png')} />
            <Text style={styles.verticalBarText}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => shareVideo(post.video_file)}>
          <View style={styles.verticalBarItem}>
            <Image style={styles.verticalBarIcon} source={require('../assets/images/reply.png')} />
          </View>
        </TouchableOpacity>
      </View>

      {
        commentModalOpen &&
        <BottomSheet
          ref={bottomSheetRef}
          index={commentModalOpen ? 0 : -1} // This controls the initial index of the BottomSheet
          snapPoints={snapPoints}
          enablePanDownToClose={true} // Enable swiping down to close
          onClose={() => setCommentModalOpen(false)}
        >
            <View style={styles.commentSection}>
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                style={{flex:1}}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image style={{width:40,height:40,borderRadius:20}} source={item && item.profile_picture ? {uri : item.profile_picture} : require('../assets/images/cropped_image.png')} />
                    <View>
                      <Text style={styles.commentUsername}>{item.username}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  </View>
                )}
              />
              <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                    placeholderTextColor="#aaa"
                  />
                  <TouchableOpacity onPress={postComment} style={styles.commentSendButton}>
                    <FontAwesome5 name="paper-plane" size={24} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </BottomSheet>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    justifyContent: 'center', // Ensure it's centered horizontally
  },
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 20,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  bottomLeftSection: {
    flex: 4,
  },
  channelName: {
    color: 'white',
    fontWeight: 'bold',
  },
  caption: {
    color: 'white',
    marginVertical: 8,
  },
  verticalBar: {
    position: 'absolute',
    right: 8,
    bottom: 72,
  },
  verticalBarItem: {
    marginBottom: 24,
    alignItems: 'center',
  },
  verticalBarIcon: {
    width: 32,
    height: 32,
  },
  verticalBarText: {
    color: 'white',
    marginTop: 4,
    textAlign:'center'
  },
  avatarContainer: {
    marginBottom: 48,
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
  },
  followIcon: {
    width: 21,
    height: 21,
  }, commentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    marginVertical: 8,
    flexDirection:'row',
    alignItems:'center',
    gap:10
  },
  commentUsername: {
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center horizontally
    marginTop: 10,
    paddingHorizontal: 10, // Add padding for some space from the edges
    paddingVertical: 5, // Adjust padding to make it visually balanced
    borderRadius: 25,
    width:Dimensions.get('window').width
  },
  commentInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 25,
    marginRight: 10,
  },
  commentSendButton: {
    padding: 10,
  },
});

export default Shorts;