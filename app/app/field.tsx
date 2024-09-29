import useAuthStore from '@/stores/authStore';
import { Feather } from '@expo/vector-icons'
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const styles = StyleSheet.create({
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
    NavbarTitle: {
        textAlign: 'center',
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold'
    },
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    mainContainer: {
        padding: 20
    },
    title: {
        fontWeight: 'bold',
        color: 'gray'
    },
    textInput: {
        borderColor: 'lightgray',
        borderBottomWidth: 1,
        borderStyle: 'solid',
        paddingVertical: 5,
    }
});

export default function EditProfileFieldScreen() {
    const { title, field, value } = useLocalSearchParams()
    const [textInputValue, setTextInputValue] = useState(value)

    const user = useAuthStore(state => state.user)

    const router = useRouter()

    const save = async () => {
        try{
            const response = await axios.patch(`http://192.168.11.101:8000/api/update-username/`, { username : textInputValue },{
                headers: {
                  Authorization: `Bearer ${user.tokens.access}`,
                },
            })
            console.log(response.data)
        }
        catch(error){
            console.log(error)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.NavbarContainer}>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Feather name='arrow-left' size={26} />
                </TouchableOpacity>

                <Text style={styles.NavbarTitle}>{title}</Text>

                <TouchableOpacity style={styles.button}>
                    <Feather name='save' size={26} color={'black'} onPress={() => save()} />
                </TouchableOpacity>
            </View>
            <View style={styles.mainContainer}>
                <Text style={styles.title}>{title}</Text>
                <TextInput
                    style={styles.textInput}
                    value={textInputValue}
                    onChangeText={setTextInputValue}
                />
            </View>

        </SafeAreaView>
    )
}