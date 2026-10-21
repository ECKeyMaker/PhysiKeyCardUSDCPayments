import React from 'react';
import {View, Image, StyleSheet, Text} from 'react-native';
import {Card} from 'react-native-paper';
import CustomText from './CustomText';

const AccountCard = ({publicKey, accountName, balance}) => {
  const truncatedKey = `${publicKey.slice(0, 7)}...${publicKey.slice(-5)}`;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View>
          <View style={styles.name}>
            <CustomText
              size="large"
              color="#000000"
              text={accountName.length === 0 ? 'Public Address' : accountName}
            />
            <Image
              source={require('../assets/logos/base_logo.png')}
              style={styles.networkIcon}
              resizeMode="contain"
            />
          </View>
          <CustomText size={'medium'} color={'#000000'} text={truncatedKey} />
        </View>
        {balance === undefined ? (
          <CustomText size="medium" color="#000000" text="" />
        ) : (
          <Text>
            <CustomText size="medium" color="#000000" text={balance} />
            <Text style={{fontSize: 16, color: '#000000'}}> USDC</Text>
          </Text>
        )}
        <Image
          source={require('../assets/icons/copy_icon.png')}
          style={styles.icon}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 15,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  name: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

export default AccountCard;
