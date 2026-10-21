// libraries
import React, {useContext, useState} from 'react';
import {Image, View} from 'react-native';
import {createMaterialBottomTabNavigator} from 'react-native-paper/react-navigation';
// components
import CustomButton from '../components/CustomButton';
// context
import {AccountContext} from '../contexts/AccountContext';
// pages
import Account from './Account';
import Transfer from './Transfer';
import History from './History';
import styles from '../styles/common';
import LoadingOverlay from '../components/LoadingOverlay';

const Tab = createMaterialBottomTabNavigator();

const Home = ({navigation}) => {
  const {loading, activity, isCard} = useContext(AccountContext);
  const [routeName, setRouteName] = useState('');

  return (
    <View style={styles.container}>
      <LoadingOverlay loading={loading} />

      <Tab.Navigator
        theme={{colors: {secondaryContainer: 'rgba(1, 1, 1, 0)'}}}
        initialRouteName="Account"
        activeColor="#000000"
        inactiveColor="#808080"
        barStyle={{backgroundColor: '#ffffff', height: 80}}
        screenListeners={{
          state: e => {
            const routeName = e.data.state.routes[e.data.state.index].name;
            setRouteName(routeName);
          },
        }}>
        <Tab.Screen
          name="Account"
          component={Account}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({focused}) => (
              <Image
                source={require('../assets/icons/home.png')}
                style={[
                  styles.tabBarIcon,
                  focused ? null : styles.inactiveTabIcon,
                ]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={History}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({focused}) => (
              <Image
                source={require('../assets/icons/history.png')}
                style={[
                  styles.tabBarIcon,
                  focused ? null : styles.inactiveTabIcon,
                ]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Load Card"
          component={Transfer}
          initialParams={{activity}}
          options={{
            tabBarLabel: 'Transfer',
            tabBarIcon: ({focused}) => (
              <Image
                source={require('../assets/icons/fund.png')}
                style={[
                  styles.tabBarIcon,
                  focused ? null : styles.inactiveTabIcon,
                ]}
              />
            ),
          }}
        />
      </Tab.Navigator>

      <View style={styles.homeButtons}>
        {routeName !== 'Load Card' &&
          (!isCard ? (
            <CustomButton
              text="Accept Payment"
              type="primary"
              size="large"
              onPress={() => {
                navigation.navigate('Request');
              }}
            />
          ) : (
            <>
              <CustomButton
                text="Send"
                type="primary"
                size="small"
                onPress={() => {
                  navigation.navigate('Send');
                }}
              />
              <CustomButton
                text="Request"
                type="primary"
                size="small"
                onPress={() => {
                  navigation.navigate('Request');
                }}
              />
            </>
          ))}
      </View>
    </View>
  );
};

export default Home;
