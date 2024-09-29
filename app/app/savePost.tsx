import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '@/stores/authStore';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 30,
        backgroundColor: 'white'
    },
    uploadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    spacer: {
        flex: 1
    },
    formContainer: {
        margin: 20,
        flexDirection: 'row'
    },
    buttonsContainer: {
        flexDirection: 'row',
        margin: 20,
    },
    inputText: {
        paddingVertical: 10,
        marginRight: 20,
        flex: 1
    },
    mediaPreview: {
        aspectRatio: 9 / 16,
        backgroundColor: 'black',
        width: 60
    },
    cancelButton: {
        alignItems: 'center',
        flex: 1,
        borderColor: 'lightgray',
        borderWidth: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 4,
        marginRight: 10
    },
    postButton: {
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#ff4040',
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 4,
        marginRight: 10
    },
    cancelButtonText: {
        marginLeft: 5,
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16
    },
    postButtonText: {
        marginLeft: 5,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});

const SavePost = () => {
  const { source, thumbnail } = useLocalSearchParams(); // Use `useLocalSearchParams` to get route params
  const [description, setDescription] = useState('')

  console.log(thumbnail)

  const user = useAuthStore(state => state.user);

  const navigation = useNavigation();
  
    const handleGoBack = () => {
        navigation.goBack();
    };

    const submit = async () => {
        try {
                
          const formData = new FormData();
          formData.append('title', 'My First Video');
          formData.append('description', description);
          formData.append('video_file', {
            uri: source,
            type: 'video/mp4', // Adjust the type based on your video format
            name: 'video.mp4'   // The filename
          });
          formData.append('thumbnail',{
            uri: thumbnail,
            type: 'image/jpeg', // Adjust type based on your thumbnail format
            name: 'thumbnail.jpg' // Adjust file name
          })
    
          const response = await axios.post('http://192.168.11.101:8000/api/videos/', formData, {
            headers: {
              Authorization: `Bearer ${user.tokens.access}`,
              'Content-Type': 'multipart/form-data' // Important for file uploads
            },
            timeout: 50000
          });
    
          console.log('Video uploaded successfully:', response.data);
          // Navigate to a different screen or show a success message
        } catch (error) {
            console.error('Error response:', error.response?.data || error.message);
          // Handle the error, e.g., show an error message to the user
        }
      };

  return (
    <View style={styles.container}>
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.inputText}
                    maxLength={150}
                    multiline
                    onChangeText={(text) => setDescription(text)}
                    placeholder="Describe your video"
                />
                <Image
                    style={styles.mediaPreview}
                    source={{ uri: thumbnail }}
                />
            </View>
            <View style={styles.spacer} />
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.cancelButton} onPress={handleGoBack}>
                    <Feather name="x" size={24} color="black" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.postButton} onPress={submit}>
                    <Feather name="corner-left-up" size={24} color="white" />
                    <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
            </View>
        </View>
  );
};

export default SavePost;