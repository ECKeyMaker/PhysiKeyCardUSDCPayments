/////////////////////////////////
// INPUT MODAL              /////
//  Main input modal used      //
// to input passwords when     //
// performing account actions  //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
// components
import Text from '../components/CustomText';
import PasswordInput from '../components/PasswordInput';
import CustomButton from '../components/CustomButton';

const InputModal = ({visible, closeModal, handlePasswords, title}) => {
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // The modal stays mounted with its screen, so don't keep typed passwords around after use
  const clearForm = () => {
    setPassword(null);
    setConfirmPassword(null);
    setErrorMessage('');
  };

  const handleClose = () => {
    clearForm();
    closeModal();
  };

  const handleConfirmPasswords = () => {
    if (password && confirmPassword) {
      if (password === confirmPassword) {
        const submitted = password;
        clearForm();
        handlePasswords(submitted);
      } else {
        setErrorMessage('The passwords do not match.');
      }
    } else {
      setErrorMessage('Please complete the form.');
    }
  };

  return (
    <Modal
      avoidKeyboard
      visible={visible}
      onRequestClose={handleClose}
      style={styles.modal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text
            size={'large'}
            color={'#000000'}
            text={'Input Password'}
            style={{alignSelf: 'center', marginBottom: 16}}
          />
          <PasswordInput
            text="Enter Password..."
            password={password}
            setPassword={setPassword}
          />
          <PasswordInput
            text="Confirm Password..."
            password={confirmPassword}
            setPassword={setConfirmPassword}
          />
          {errorMessage ? (
            <Text size={'small'} color={'#FF0000'} text={errorMessage} />
          ) : null}
          <CustomButton
            text="Enter"
            type="primary"
            size="small"
            onPress={handleConfirmPasswords}
            style={{alignSelf: 'center', marginTop: 16}}
          />
          <CustomButton
            text="Go Back"
            type="secondary"
            size="small"
            onPress={handleClose}
            style={{alignSelf: 'center', marginTop: 16}}
          />
        </View>
      </View>
    </Modal>
  );
};

export default InputModal;

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
  inlineButton: {
    marginTop: 32,
  },
  errorMessage: {
    color: 'red',
    margin: 16,
  },
});
