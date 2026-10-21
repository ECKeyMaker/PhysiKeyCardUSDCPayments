// libraries
import React, {useState, useEffect, useContext} from 'react';
import {View, ImageBackground} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
// context
import {AccountContext} from '../contexts/AccountContext';
// functions
import {
  formatDataByDay,
  formatDataByMonth,
} from '../functions/core/getBaseUSDCActivity';
// components
import DayListComponent from '../components/MonthActivityList';
import MonthListComponent from '../components/DayActivityList';
import Text from '../components/CustomText';

const Tab = createMaterialTopTabNavigator();

const History = () => {
  const {activity, historyError} = useContext(AccountContext);

  const [dayData, setDayData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const day = formatDataByDay(activity);
        const month = formatDataByMonth(activity);
        setDayData(day);
        setMonthData(month);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [activity]);

  const isActivityEmpty = activity.length === 0;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={{flex: 1, width: '100%', height: '100%'}}>
      {isActivityEmpty ? (
        <View style={{flex: 8, margin: 16, justifyContent: 'center'}}>
          <Text
            size={'large'}
            color={'#000000'}
            text={
              historyError
                ? `${historyError} Your balance is still up to date. Pull down on the Home tab to try again.`
                : 'Your account has no transaction history.'
            }
            style={{textAlign: 'center'}}
          />
        </View>
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarIndicatorStyle: {backgroundColor: '#2E3C49'},
            tabBarLabelStyle: {
              fontFamily: 'LeagueSpartan-Regular',
              fontSize: 24,
              textTransform: 'none',
            },
          }}>
          <Tab.Screen
            name="Month"
            children={() => (
              <View style={{flex: 1}}>
                <MonthListComponent formattedData={monthData} limit={1000} />
              </View>
            )}
          />
          <Tab.Screen
            name="Day"
            children={() => (
              <View style={{flex: 1}}>
                <DayListComponent formattedData={dayData} limit={1000} />
              </View>
            )}
          />
        </Tab.Navigator>
      )}
      <View style={{height: 50}} />
    </ImageBackground>
  );
};

export default History;
