import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import useAuthStore from '@/stores/authStore'
import { useRouter } from 'expo-router'
import axios from 'axios'
import * as FileSystem from 'expo-file-system';

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

export default function EditProfileScreen() {
    const user = useAuthStore(state => state.user)
    const [image, setImage] = useState(null) // State to store the selected image
    const router = useRouter() 

    const chooseImage = async () => {
        // Request permission to access media library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }
    
        // Now that permissions are granted, open the image picker
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
    
        if (!result.canceled) {
            console.log('Selected image URI:', result.assets[0].uri);
            const file = await getFileUri(result.assets[0].uri);
            setImage(file);
            await uploadProfilePicture(file);
        }
    };

    const uploadProfilePicture = async (imageUri) => {
        const formData = new FormData();
        formData.append('profile_picture', {
            uri: imageUri,
            name: 'profile.jpg',
            type: 'image/jpeg',
        });
    
        try {
            const response = await axios.patch(
                'http://192.168.11.101:8000/api/profile-picture/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.tokens.access}`,
                    },
                    timeout: 50000
                }
            );
            console.log(response.data);
        } catch (error) {
            console.error("Network error:", error);
        }
    };
        
    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.NavbarContainer}>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Feather name='arrow-left' size={26} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
            </View>
            <View style={styles.imageContainer}>
                <TouchableOpacity
                    style={styles.imageViewContainer}
                    onPress={() => chooseImage()}
                >
                    <Image
                        style={styles.image}
                        source={user.user && user.user.profile_picture ? {uri : user.user.profile_picture} : require('../assets/images/cropped_image.png')} />
                    <View style={styles.imageOverlay} />
                    <Feather name='camera' size={26} color='white' />
                </TouchableOpacity>
            </View>

            <View style={styles.fieldsContainer}>
                <TouchableOpacity
                    style={styles.fieldItemContainer}
                    onPress={() => router.push({
                        pathname: 'field',
                        params: {
                          title: 'Display Name',
                          field: 'displayName',
                          value: user.user.username,
                        },
                    })}
                >
                    <Text>Display Name</Text>
                    <View style={styles.fieldValueContainer}>
                        <Text>{user.user.username}</Text>
                        <Feather name='chevron-right' size={20} color='gray' />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    imageContainer: {
        alignItems: 'center',
        marginTop: 20
    },
    imageViewContainer: {
        backgroundColor: 'gray',
        height: 100,
        width: 100,
        borderRadius: 50,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        height: 100,
        width: 100,
        position: 'absolute'
    },
    imageOverlay: {
        backgroundColor: 'rgba(0,0,0, 0.5)',
        ...StyleSheet.absoluteFill
    },

    fieldsContainer: {
        marginTop: 20,
        padding: 20,
        flex: 1
    },
    fieldItemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldValueContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    NavbarContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15
    },
    button: {
        height: 40,
        width: 40,
        justifyContent: 'center'
    },
    title: {
        textAlign: 'center',
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold'
    }
});