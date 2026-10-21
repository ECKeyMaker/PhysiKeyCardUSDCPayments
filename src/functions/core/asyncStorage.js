import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (name, value) => {
  console.log('storing', name, value);
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch (error) {
    console.log('Could not complete storeData: ', error);
  }
};

export const getData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    console.log('Your saved accounts: ', items);
    return (
      items
        // Earlier versions saved every login under a blank name; hide those entries
        .filter(([key, value]) => key !== 'default' && key.trim() !== '')
        .map(([key, value]) => ({key, value: JSON.parse(value)}))
    );
  } catch (error) {
    console.log('Could not complete getData: ', error);
    return [];
  }
};

export const removeItemFromAsyncStorage = async key => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('Item removed from AsyncStorage:', key);
  } catch (error) {
    console.error('Error removing item from AsyncStorage:', error);
  }
};
