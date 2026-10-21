// libraries
import React, {useContext, useState, useCallback} from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {trigger} from 'react-native-haptic-feedback';
// components
import AccountCard from '../components/AccountCard';
import CurrencyCard from '../components/CurrencyCard';
import RecentTransactionList from '../components/TransactionList';
import Text from '../components/CustomText';
import SaveAccount from '../components/SaveAccountModal';
// context
import {AccountContext} from '../contexts/AccountContext';
// styles
import styles from '../styles/common';

const Account = ({navigation}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const {
    activity,
    publicKey,
    accountName,
    balance,
    setNewActivity,
    setNewBalance,
    isCard,
    setNewAccount,
  } = useContext(AccountContext);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNewActivity(publicKey);
    setNewBalance(publicKey);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [publicKey, setNewActivity, setNewBalance]);

  const handleCopyToClipboard = () => {
    trigger('impactHeavy', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    Clipboard.setString(publicKey);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <ImageBackground
        source={require('../assets/background.png')}
        style={{flex: 1, width: '100%', height: '100%'}}>
        <View style={styles.textContainer}>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#fff',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 15,
              alignItems: 'center',
            }}>
            <Text size={'small'} color={'#000000'} text={'Save Account'} />
          </Pressable>
        </View>
        <Pressable onPress={handleCopyToClipboard}>
          <AccountCard publicKey={publicKey} accountName={accountName} />
        </Pressable>
        <CurrencyCard
          title="Balance"
          subtitle="*USDC on Base network"
          amount={balance}
          imageSource={require('../assets/logos/usdc_base_logo.png')}
          navigation={navigation}
          publicKey={publicKey}
        />
        <View style={styles.textContainer}>
          <Text size={'small'} color={'#000000'} text={'Recent Transactions'} />
          <Pressable
            onPress={() => {
              navigation.navigate('History');
            }}>
            <Text size={'small'} color={'#000000'} text={'View All >'} />
          </Pressable>
        </View>
        <RecentTransactionList
          navigation={navigation}
          data={activity}
          limit={3}
        />
        <View style={{height: 80}} />
      </ImageBackground>
      <SaveAccount
        visible={modalVisible}
        closeModal={() => setModalVisible(false)}
        address={publicKey}
        title="Save Account"
      />
    </ScrollView>
  );
};

export default Account;
