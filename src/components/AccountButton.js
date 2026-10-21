import React from 'react';
import {Pressable, View, Image, StyleSheet} from 'react-native';
import {Card} from 'react-native-paper';
import Text from './CustomText';

const AccountButton = ({publicKey, updateAccount, navigation}) => {
  return (
    <Pressable
      onPress={() => {
        updateAccount(publicKey);
        navigation.navigate('Home');
      }}>
      <Card style={styles.card}>
        <View style={styles.keyContent}>
          <Text size={'medium'} color={'#000000'} text={'Account'} />
          <Image
            source={require('../assets/logos/base_logo.png')}
            style={styles.networkIcon}
            resizeMode="contain"
          />
          <Text
            size={'medium'}
            color={'#000000'}
            text={`  ${publicKey.slice(0, 7)}...${publicKey.slice(-5)}`}
          />
          <Image
            source={require('../assets/icons/user_setting.png')}
            style={styles.icon}
          />
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    height: 48,
  },
  keyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    width: '100%',
  },
  networkIcon: {
    width: 16,
    height: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

export default AccountButton;
