/**
 * Checks the NFC tag and processes its NDEF message.
 * Starts the NFC manager, requests NFC technology, retrieves the tag, processes the NDEF record,
 * and returns the result based on the validity of the NDEF message.
 * @returns {Promise<ReadCardResults>} - Resolves with an object containing success, message, result code, and the data chain from the NFC tag.
 * @throws {Error} - Throws an error if NFC tag retreival or message decoding fails.
 */

import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

interface ReadCardResults {
  success: boolean;
  resultCode: number;
  text?: string;
}

export const readCard = async (): Promise<ReadCardResults> => {
  try {
    await NfcManager.start();
    await NfcManager.cancelTechnologyRequest();
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    if (!tag) {
      throw new Error('Failed to retrieve NFC tag.');
    }
    const {ndefMessage} = tag;
    if (
      !ndefMessage ||
      ndefMessage.length === 0 ||
      ndefMessage[0].payload.length === 0
    ) {
      return {
        success: true,
        resultCode: 0, //empty tag
        text: '',
      };
    } else {
      const record = ndefMessage[0];
      const payload = record.payload;
      // The library types expect a Uint8Array, but the payload is a number[] at runtime and decodes correctly as-is
      const text = Ndef.text.decodePayload(payload as unknown as Uint8Array);
      return {
        success: true,
        resultCode: 1, // non empty tag
        text: text,
      };
    }
  } catch (error) {
    throw new Error(`Failed to process NFC tag: ${(error as Error).message}`);
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
};
