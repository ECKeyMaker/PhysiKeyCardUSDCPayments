import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
// components
import Text from '../components/CustomText';
import CustomButton from '../components/CustomButton';

const WarningModal = ({visible, closeModal, handleConfirm}) => {
  // Added handleConfirm prop
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
            text={'Are you sure?'}
            style={{alignSelf: 'center', marginBottom: 16}}
          />
          <Text
            size={'medium'}
            color={'#000000'}
            text={
              'Please make sure any funds are removed from your old account first. '
            }
          />
          <Text
            size={'medium'}
            color={'#000000'}
            text={'We do not save your old accounts. '}
          />
          <CustomButton
            text="Confirm"
            type="primary"
            size="small"
            onPress={handleConfirm}
            style={{alignSelf: 'center', marginTop: 16}}
          />
          <CustomButton
            text="Go Back"
            type="secondary"
            size="small"
            onPress={closeModal}
            style={{alignSelf: 'center', marginTop: 16}}
          />
        </View>
      </View>
    </Modal>
  );
};

export default WarningModal;

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
});
