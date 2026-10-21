/////////////////////////////////
// DAY ACTIVITY LIST        /////
// List activity by the day    //
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

const DayListComponent = ({formattedData, limit}) => {
  const {dailyAmount} = useContext(AccountContext);

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
        {formattedData.map((dayData, index) => (
          <TransactionList key={index} data={dayData.data} limit={limit} />
        ))}
      </ScrollView>
    </>
  );
};

export default DayListComponent;
