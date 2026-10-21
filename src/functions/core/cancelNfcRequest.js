import NfcManager from 'react-native-nfc-manager';

export const cancelNfc = async () => {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch (error) {
    console.error('Error cancelling NFC requests:', error);
  }
};
