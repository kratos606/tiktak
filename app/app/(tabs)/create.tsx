import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import Animated, { interpolateColor, useAnimatedProps, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";
import * as FileSystem from 'expo-file-system';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useAuthStoreWithInit } from '@/stores/authStore';

const getFileUri = async (uri) => {
  try {
    // Get the video file name from the original URI
    const fileName = uri.split('/').pop();

    // Copy the file to a permanent directory, e.g., to the app's document directory
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    return newPath;  // This is the new, usable file URI
  } catch (error) {
    console.error('Error copying file:', error);
    return null;
  }
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const radius = 45;
const circumference = radius * Math.PI * 2;
const duration = 60000;

const ProgressCircle = ({ totalDuration, maxDuration }) => {
  const strokeOffset = useSharedValue(circumference);

  const percentage = useDerivedValue(() => {
    return (totalDuration / maxDuration) * 100;
  });

  const strokeColor = useDerivedValue(() => {
    return interpolateColor(
      percentage.value,
      [0, 50, 100],
      ["#9E4784", "#66347F", "#37306B"]
    );
  });

  const animatedCircleProps = useAnimatedProps(() => {
    const offset = circumference - (circumference * percentage.value) / 100;
    return {
      strokeDashoffset: withTiming(offset, { duration: 300 }), // Smoothly animate the offset
      stroke: strokeColor.value,
    };
  });

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

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Svg height="80" width="80" viewBox="0 0 80 80" >
        <AnimatedCircle
          animatedProps={animatedCircleProps}
          cx="40"
          cy="40"
          r={40 - (10 / 2)}
          strokeDasharray={radius * Math.PI * 2}
          strokeWidth="10"
          stroke={'#ff404087'}
          fill="transparent"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30
    },
    camera: {
        flex: 1,
        backgroundColor: 'black',
        aspectRatio: 9 / 16,
    },
    bottomBarContainer: {
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        marginBottom: 30,
    },
    recordButtonContainer: {
        flex: 1,
        marginHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    galleryButton: {
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        width: 50,
        height: 50,
    },
    galleryButtonImage: {
        width: 50,
        height: 50,
    },
    sideBarContainer: {
        top: 60,
        right: 0,
        marginHorizontal: 20,
        position: 'absolute'
    },
    iconText: {
        color: 'white',
        fontSize: 12,
        marginTop: 5
    },
    sideBarButton: {
        alignItems: 'center',
        marginBottom: 25
    }
});

const Create = () => {
  const [hasCameraPermissions, setHasCameraPermissions] = useState(false);
  const [hasAudioPermissions, setHasAudioPermissions] = useState(false);
  const [hasGalleryPermissions, setHasGalleryPermissions] = useState(false);

  const [videoSegments, setVideoSegments] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingStopped, setIsRecordingStopped] = useState(false);
  const [recordingCompleted, setRecordingCompleted] = useState(true);

  const [recordingStartTime, setRecordingStartTime] = useState(null);

  const [totalDuration, setTotalDuration] = useState(0);

  const navigation = useNavigation();

  const [galleryItems, setGalleryItems] = useState([]);
  const cameraRef = useRef(null);
  const [cameraType, setCameraType] = useState('back');
  const [cameraFlash, setCameraFlash] = useState(false);
  const isFocused = useIsFocused();

  const [timer, setTimer] = useState(0);
  const [maxDuration, setMaxDuration] = useState(60); // Max duration in seconds
  const timerRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState(0);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const pickFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      let fileUri = await getFileUri(result.assets[0].uri);
      let sourceThumb = await generateThumbnail(fileUri);
      let thumbnail = await getFileUri(sourceThumb);
      navigation.navigate('savePost', { source: fileUri, thumbnail: thumbnail });
    }
  };

  useEffect(() => {
    let intervalId;
    if (isRecording) {
      const startTime = Date.now() - elapsedTime * 1000; // Account for previously elapsed time
      intervalId = setInterval(() => {
        const currentTime = Date.now();
        const newElapsedTime = (currentTime - startTime) / 1000;
        setElapsedTime(newElapsedTime);
        setTotalDuration(Math.min(newElapsedTime, maxDuration));
        
        if (newElapsedTime >= maxDuration) {
          stopRecording();
        }
      }, 100); // Update more frequently for smoother animation
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    if (cameraRef.current && recordingCompleted && totalDuration < maxDuration) {
      setIsRecording(true);
      setRecordingCompleted(false);
      
      try {
        const video = await cameraRef.current.recordAsync();
        setVideoSegments((prevSegments) => [...prevSegments, video.uri]);
      } catch (error) {
        console.error('Failed to record video:', error);
      } finally {
        setRecordingCompleted(true);
      }
    }
  };

  const pauseRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      setIsRecordingStopped(true);
      setElapsedTime(0);
    }
  };

  const generateThumbnail = async (source) => {
    try {
      if (typeof source !== 'string' || !source) {
        console.warn('Invalid source provided to generateThumbnail:', source);
        return null;
      }
  
      const { uri } = await VideoThumbnails.getThumbnailAsync(source, {
        time: 5000,
      });
  
      return uri;
    } catch (e) {
      console.warn('Error generating thumbnail:', e);
      return null;
    }
  };

  useEffect(() => {
    if (isRecordingStopped && recordingCompleted && videoSegments.length > 0) {
      console.log('Video Segments:', videoSegments);
      concatenateVideos();
      setIsRecordingStopped(false);
    }
  }, [videoSegments, isRecordingStopped, recordingCompleted]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermissions(cameraStatus.status === 'granted');

      const audioStatus = await Audio.requestPermissionsAsync();
      setHasAudioPermissions(audioStatus.status === 'granted');

      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermissions(galleryStatus.status === 'granted');

      if (galleryStatus.status === 'granted') {
        const userGalleryMedia = await MediaLibrary.getAssetsAsync({
          sortBy: ['creationTime'],
          mediaType: ['video'],
        });
        setGalleryItems(userGalleryMedia.assets);
      }
    })();
  }, []);

  const concatenateVideos = async () => {
    if (videoSegments.length < 2) {
      let sourceThumb = await generateThumbnail(videoSegments[0])
      let fileUri = await getFileUri(videoSegments[0]);
      navigation.navigate('savePost', { source: fileUri, thumbnail: sourceThumb })
      return
    }

    const outputFilePath = `${FileSystem.cacheDirectory}output.mp4`;
    const listFilePath = `${FileSystem.cacheDirectory}filelist.txt`;

    const fileList = videoSegments.map(uri => `file '${uri}'`).join('\n');

    try {
      await FileSystem.writeAsStringAsync(listFilePath, fileList, { encoding: FileSystem.EncodingType.UTF8 });

      const ffmpegCommand = `-f concat -safe 0 -i ${listFilePath} -c copy ${outputFilePath}`;
      FFmpegKit.execute(ffmpegCommand).then(async (session) => {
        const returnCode = await session.getReturnCode();
        if (returnCode.isValueSuccess()) {
          console.log('Video concatenation successful:', outputFilePath);
        } else {
            console.error('Failed to concatenate videos:', returnCode);
          }
        });
      } catch (error) {
        console.error('Error writing file list:', error);
      }
    };

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!hasCameraPermissions || !hasAudioPermissions || !hasGalleryPermissions) {
        return <View></View>;
    }

    return (
        <View style={styles.container}>
            {isFocused ?
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    mode='video'
                    ratio={'16:9'}
                    facing={cameraType}
                    enableTorch={cameraFlash}
                    onCameraReady={() => setIsCameraReady(true)}
                />
                : null}
            <TouchableOpacity
                onPress={handleGoBack}
                style={{ position: 'absolute', left: 10, top: 10 }}
            >
                <MaterialIcons name="close" size={30} color="white" />
            </TouchableOpacity>
            <View style={{ position: 'absolute', right: 10, top: 20, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 50, gap: 20 }}>
                <TouchableOpacity onPress={() => {
                    setCameraType(cameraType === 'back' ? 'front' : 'back');
                }}>
                    <MaterialIcons name="flip-camera-android" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    setCameraFlash(!cameraFlash);
                }}>
                    <MaterialIcons name={cameraFlash ? "flash-on" : "flash-off"} size={30} color="white" />
                </TouchableOpacity>
            </View>
            <View style={styles.bottomBarContainer}>
                <View style={{ flex: 1 }}></View>
                <View style={styles.recordButtonContainer}>
                    <TouchableOpacity
                        disabled={!isCameraReady}
                        onPress={isRecording ? pauseRecording : startRecording}
                        style={{
                            backgroundColor: (isRecording || (videoSegments.length > 0)) ? 'transparent' : '#ff4040',
                            borderRadius: 100,
                            height: 80,
                            width: 80,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {(isRecording || (videoSegments.length > 0)) && (
                            <ProgressCircle totalDuration={totalDuration} maxDuration={maxDuration} />
                        )}
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                    {(!isRecording && videoSegments.length < 1) ? <TouchableOpacity
                        onPress={() => pickFromGallery()}
                        style={styles.galleryButton}
                    >
                        {galleryItems[0] === undefined ?
                            <></>
                            :
                            <Image
                                style={styles.galleryButtonImage}
                                source={{ uri: galleryItems[0].uri }}
                            />}
                    </TouchableOpacity> :
                    <View>
                        <TouchableOpacity
                            onPress={stopRecording}
                            style={{
                            backgroundColor: '#ff4040',
                            borderRadius: 50,
                            width: 30,
                            height: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            }}
                        >
                            <MaterialIcons name="check" size={25} color="white" />
                        </TouchableOpacity>
                    </View>}
                </View>
            </View>
        </View>
    );
};

export default Create;