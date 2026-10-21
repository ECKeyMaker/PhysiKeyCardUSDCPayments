import NfcManager, {NfcTech} from 'react-native-nfc-manager';

export default async function disablePassword() {
  await NfcManager.requestTechnology(NfcTech.NfcA);

  const password = [0x12, 0x34, 0xab, 0xcd];
  const pack = [0xaa, 0xbb];

  const passwordFormat = [0x00, 0x00, 0x00, 0x00];
  const packFormat = [0x00, 0x00];

  let respBytes = null;
  let writeRespBytes = null;
  let authPageIdx;

  // check if this is NTAG 213 or NTAG 215
  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 0]);
  const cc2 = respBytes[14];
  if (cc2 * 8 > 256) {
    authPageIdx = 131; // NTAG 215
  } else {
    authPageIdx = 41; // NTAG 213
  } // May need to add another value if you want to enable NTAG 216 also

  // get respBytes Array and set auth
  respBytes = await NfcManager.nfcAHandler.transceive([0x30, authPageIdx]);
  const auth = respBytes[3];

  if (auth === 4) {
    writeRespBytes = await NfcManager.nfcAHandler.transceive([
      0x1b,
      ...password,
    ]);
    console.warn(writeRespBytes);
    if (writeRespBytes[0] !== pack[0] || writeRespBytes[1] !== pack[1]) {
      throw new Error('incorrect password');
    }

    // disable password protection
    writeRespBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      authPageIdx + 3,
      ...packFormat,
      respBytes[14],
      respBytes[15],
    ]);

    writeRespBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      authPageIdx + 2,
      ...passwordFormat,
    ]);

    writeRespBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      authPageIdx + 1,
      respBytes[4] & 0x7f, // Why does this have 0x7f? May need to look at the datasheets
      respBytes[5],
      respBytes[6],
      respBytes[7],
    ]);

    writeRespBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      authPageIdx,
      respBytes[0],
      respBytes[1],
      respBytes[2],
      255,
    ]);
  }
}
