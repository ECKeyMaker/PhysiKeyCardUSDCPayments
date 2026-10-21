/////////////////////////////////
// ANDROID SCAN MODAL     ///////
// Android specific modal for  //
// scanning NFC chips          //
// this mimics iOS popups      //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React from 'react';
import {Modal, View, Image, StyleSheet} from 'react-native';
// components
import CustomButton from '../components/CustomButton';
import Text from '../components/CustomText';

const AndroidScanModal = ({visible, closeScanModal}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={closeScanModal}>
      <View style={styles.modalContainer}>
        <View style={styles.bottomThirdContainer}>
          <Text size={'large'} color={'#000000'} text={'Ready to Scan'} />
          <Image
            source={require('../assets/icons/nfc_icon.png')}
            resizeMode="contain"
            scanModalImage
            style={styles.scanModalImage}
          />
          <Text
            size={'medium'}
            color={'#000000'}
            text={'Hold device near NFC tag.'}
          />
          <CustomButton
            text="Cancel"
            type="primary"
            size="small"
            onPress={closeScanModal}
            style={{alignSelf: 'center', marginTop: 16}}
          />
        </View>
      </View>
    </Modal>
  );
};

export default AndroidScanModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  bottomThirdContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    padding: 20,
  },
  scanModalImage: {
    height: 150,
    margin: 16,
  },
});
