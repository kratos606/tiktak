import { FlatList, TextInput, TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Importing Ionicons from Expo
import { useRouter } from 'expo-router';

const Search = () => {
  const [textInput, setTextInput] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);

  const router = useRouter()

  useEffect(() => {
    // Optionally clear search results when input is cleared
    if (textInput === '') {
      setSearchUsers([]);
      setNextPage(null); // Reset pagination as well
    }
  }, [textInput]);

  const fetchUsers = async (currentPage = 1, reset = false) => {
    if (loading || (currentPage > 1 && !nextPage)) return;  // Prevent extra calls
    setLoading(true);

    try {
      const response = await axios.get('http://192.168.11.101:8000/api/users/search/', {
        params: { search: textInput, page: currentPage }
      });

      const data = response.data;
      if (reset) {
        setSearchUsers(data.results);  // Replace existing users with new search results
      } else {
        setSearchUsers(prevUsers => [...prevUsers, ...data.results]);  // Append new users to the list
      }
      setNextPage(data.next);  // Save the next page URL for pagination
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (textInput.trim()) {
      setPage(1);  // Reset page when a new search is initiated
      fetchUsers(1, true);  // Fetch the first page of results
    }
  };

  const handleEndReached = () => {
    if (nextPage) {
      setPage(prevPage => prevPage + 1);
      fetchUsers(page + 1);  // Load the next page when the end of the list is reached
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            onChangeText={setTextInput}
            style={styles.textInput}
            placeholder={'Search'}
            value={textInput}
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={searchUsers}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userContainer} onPress={() => router.push(`/profile/${item.id}`)}>
            <Image style={styles.image} source={item && item.profile_picture ? {uri : item.profile_picture} : require('../assets/images/cropped_image.png')} />
            <Text style={styles.text}>{item.username}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleEndReached}  // Trigger pagination
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    marginRight: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'lightgray',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 5,
  },
  searchButton: {
    marginLeft: 10,
  },
  searchButtonText: {
    color: 'red',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'gray',
  },
});
