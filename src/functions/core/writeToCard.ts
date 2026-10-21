/**
 * Sets up the NFC card by writing random data to the NFC tag and retrieving the associated tag information.
 * This function starts the NFC manager, writes random data to the NFC tag, retrieves the tag's ID,
 * constructs a data chain, and uses it to generate a public key.
 * @returns {Promise<SetupCardResult>} - Resolves with an object containing the public key or null if the setup fails.
 * @throws {Error} - Throws an error if the NFC tag cannot be read or written to, or if the public key generation fails.
 */

import NfcManager, {Ndef, NfcTech} from 'react-native-nfc-manager';
import {randomBytes} from 'react-native-randombytes';

interface SetupCardResult {
  randVal: string;
}

export const writeToCard = async (): Promise<SetupCardResult> => {
  const randVal = randomBytes(32).toString('hex');
  try {
    await NfcManager.start();
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const nfcInput = Ndef.textRecord(randVal);
    const nfcMessage = Ndef.encodeMessage([nfcInput]);
    await NfcManager.ndefHandler.writeNdefMessage(nfcMessage);
    return {randVal};
  } catch (error) {
    console.error('Error in setupCard:', error);
    throw error;
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
};
