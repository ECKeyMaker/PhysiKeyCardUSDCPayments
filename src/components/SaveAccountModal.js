/////////////////////////////////
// SAVE ACCOUNT MODAL       /////
//                             //
//                             //
//                             //
//                             //
//                             //
/////////////////////////////////

// libraries
import React, {useState} from 'react';
import {View, StyleSheet, Keyboard, Platform} from 'react-native';
import Modal from 'react-native-modal';
import Text from './CustomText';
import {TextInput} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {storeData} from '../functions/core/asyncStorage';

// components
import CustomButton from '../components/CustomButton';

const SaveAccount = ({visible, closeModal, address, title}) => {
  const [label, setLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLabel = async () => {
    Keyboard.dismiss();
    if (label.trim() !== '') {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys);
        const accountNames = items.map(item => item[0]);
        const inputName = label;
        const isDuplicate = accountNames.includes(inputName);
        if (isDuplicate) {
          setErrorMessage(
            'This name is already being used on this device. Please try another name.',
          );
          return;
        }
        setErrorMessage('');
        closeModal();
        await storeData(inputName, address);
        setLabel('');
      } catch (error) {
        console.error('Error retrieving accounts from AsyncStorage:', error);
      }
    } else {
      setErrorMessage('Please enter a name.');
    }
  };

  return (
    <Modal
      avoidKeyboard
      visible={visible}
      onRequestClose={closeModal}
      style={styles.modal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text
            size={'large'}
            color={'#000000'}
            text={`${title}`}
            style={{alignSelf: 'center', marginBottom: 16}}
          />
          <TextInput
            mode="outlined"
            theme={{colors: {primary: '#2E3C49'}}}
            keyboardType={
              Platform.OS === 'android' ? 'email-address' : 'ascii-capable'
            }
            returnKeyType="done"
            style={styles.textInput}
            placeholder={'Enter name...'}
            value={label}
            onChangeText={setLabel}
            autoCapitalize="none"
          />
          {errorMessage ? (
            <Text size={'small'} color={'#FF0000'} text={errorMessage} />
          ) : null}
          <CustomButton
            text="Enter"
            type="primary"
            size="small"
            onPress={() => {
              handleLabel();
            }}
            style={{alignSelf: 'center', marginTop: 16}}
          />
          <CustomButton
            text="Close"
            type="secondary"
            size="small"
            onPress={() => {
              closeModal();
            }}
            style={{alignSelf: 'center', marginTop: 16}}
          />
        </View>
      </View>
    </Modal>
  );
};

export default SaveAccount;

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 15,
  },
  errorMessage: {
    color: 'red',
    margin: 10,
  },
  textInput: {
    fontSize: 24,
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
  },
});
