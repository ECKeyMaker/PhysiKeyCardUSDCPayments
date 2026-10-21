/////////////////////////////////
// TRANSACTION LIST         /////
// Used on account page        //
// shows recent transactions   //
// on the give account         //
//                             //
//                             //
/////////////////////////////////

// libraries
import React from 'react';
import {StyleSheet, Pressable, View, Linking} from 'react-native';
import {List, Card} from 'react-native-paper';
// components
import Text from '../components/CustomText';

const TransactionList = ({data, limit}) => {
  const openFullDetails = hash => {
    const url = `https://basescan.org/tx/${hash}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const formatDate = string => {
    let date = new Date(string);
    let formattedDate = new Intl.DateTimeFormat('default', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return formattedDate;
  };

  return (
    <>
      {data.length === 0 ? (
        <View style={styles.placeholder}>
          <Text size="large" text={'No recent transactions.'} />
        </View>
      ) : (
        <Card style={styles.card}>
          <View>
            <List.Section>
              {data.slice(0, limit).map((item, index) => (
                <Pressable
                  onPress={() => openFullDetails(item.hash)}
                  key={index}>
                  <View
                    style={[
                      styles.listItem,
                      (index === data.length - 1 && styles.lastItem) ||
                        (limit === 3 && index === 2 && styles.lastItem),
                    ]}>
                    <List.Item
                      title={() => (
                        <Text size="medium" text={formatDate(item.age)} />
                      )}
                      description={() => (
                        <Text
                          size="small"
                          text={`${
                            item.hash
                              ? item.hash.slice(0, 10) +
                                '...' +
                                item.hash.slice(-10)
                              : ''
                          }`}
                        />
                      )}
                    />
                    <Text
                      size="medium"
                      color={item.method === 'IN' ? 'green' : 'red'}
                      text={`${item.method === 'IN' ? '+' : '-'}${Number(
                        item.value,
                      ).toFixed(2)}`}
                      style={
                        item.method === 'IN' ? styles.greenText : styles.redText
                      }
                    />
                  </View>
                </Pressable>
              ))}
            </List.Section>
          </View>
        </Card>
      )}
    </>
  );
};

export default TransactionList;

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
  lastItem: {
    borderBottomWidth: 0,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  greenText: {
    color: 'green',
    marginRight: 16,
  },
  redText: {
    color: 'red',
    marginRight: 16,
  },
  placeholder: {
    marginHorizontal: 16,
  },
});
