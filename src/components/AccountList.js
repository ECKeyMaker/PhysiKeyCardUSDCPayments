/////////////////////////////////
// ACCOUNT LIST COMPONENT ///////
// Handles the account list    //
// utilizing async storage     //
// to populate the list        //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React, {useRef, useContext} from 'react';
import {StyleSheet, ScrollView, Pressable, View, Image} from 'react-native';
import {List, Card} from 'react-native-paper';
import {Swipeable} from 'react-native-gesture-handler';
// components
import Text from '../components/CustomText';
// context
import {AccountContext} from '../contexts/AccountContext';
// functions
import {
  removeItemFromAsyncStorage,
  getData,
} from '../functions/core/asyncStorage';

const AccountList = ({data, navigation, setData}) => {
  const {setNewActivity, setNewBalance, setNewName, setNewPublicKey} =
    useContext(AccountContext);
  const swipeableRefs = useRef([]);

  const renderRightActions = (item, index) => {
    return (
      <Pressable
        onPress={() => handleRemoveItem(item, index)}
        style={[styles.rightAction, {transform: [{translateX: 0}]}]}>
        <View style={styles.removeButton}>
          <Text size={'small'} color={'#ffffff'} text={'Remove'} />
        </View>
      </Pressable>
    );
  };

  const handleRemoveItem = async (item, index) => {
    try {
      await removeItemFromAsyncStorage(item.key);
      const updatedData = await getData();
      setData(updatedData);
      if (swipeableRefs.current[index]) {
        swipeableRefs.current[index].close();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <>
      <Card style={styles.card}>
        <ScrollView>
          <List.Section>
            {data.map((item, index) => (
              <Swipeable
                key={index}
                ref={ref => (swipeableRefs.current[index] = ref)}
                renderRightActions={() => renderRightActions(item, index)}
                friction={1}
                tension={50}
                rightThreshold={10}>
                <Pressable
                  onPress={() => {
                    setNewActivity(item.value);
                    setNewBalance(item.value);
                    setNewPublicKey(item.value);
                    setNewName(item.key);
                    navigation.navigate('Home');
                  }}>
                  <View style={styles.listItem}>
                    <List.Item
                      title={() => <Text size="large" text={`${item.key}`} />}
                      description={() => (
                        <Text
                          size="small"
                          text={`${
                            item.value
                              ? item.value.slice(0, 10) +
                                '...' +
                                item.value.slice(-10)
                              : ''
                          }`}
                        />
                      )}
                    />
                    <Image
                      source={require('../assets/icons/drag_handle.png')}
                      style={styles.icon}
                    />
                  </View>
                </Pressable>
              </Swipeable>
            ))}
          </List.Section>
        </ScrollView>
      </Card>
    </>
  );
};

export default AccountList;

const styles = StyleSheet.create({
  listItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomColor: '#000000',
    borderBottomWidth: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  rightAction: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100, // width of the right action button space
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#de0a26',
    borderRadius: 15,
    height: 48,
    width: 84,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
});
