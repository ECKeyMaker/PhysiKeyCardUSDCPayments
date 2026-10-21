/////////////////////////////////
// CURRENCY CARD COMPONENT //////
// Clean display for the       //
// amount in a given wallet.   //
// Uses publikKey and getBaseUSDC
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {Card} from 'react-native-paper';
import Text from '../components/CustomText';

const CurrencyCard = ({title, subtitle, amount, imageSource}) => {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
        <View>
          <Text size={'large'} color={'#000000'} text={title} />
          <Text size={'small'} color={'#000000'} text={subtitle} />
          <View style={styles.amountContainer}>
            <Text size={'xl'} color={'#000000'} text={amount} />
            <Text size={'large'} color={'#000000'} text={' USDC'} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 15,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

export default CurrencyCard;
