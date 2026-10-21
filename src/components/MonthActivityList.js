/////////////////////////////////
// DAY ACTIVITY LIST        /////
// List activity by the month  //
// Used in History page        //
//                             //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React, {useContext} from 'react';
import {ScrollView, View} from 'react-native';
// context
import {AccountContext} from '../contexts/AccountContext';
// components
import TransactionList from './TransactionList';
import Text from '../components/CustomText';

const MonthListComponent = ({formattedData, limit}) => {
  const {dailyAmount} = useContext(AccountContext);
  console.log(dailyAmount);
  return (
    <>
      <View style={{margin: 16, justifyContent: 'center'}}>
        <Text
          size={'medium'}
          color={'#000000'}
          text={`Past 24hr:  ${dailyAmount} USDC`}
        />
      </View>
      <ScrollView>
        {formattedData.map((monthData, index) => (
          <TransactionList key={index} data={monthData.data} limit={limit} />
        ))}
      </ScrollView>
    </>
  );
};

export default MonthListComponent;
