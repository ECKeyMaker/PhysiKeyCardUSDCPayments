import {generateSecureRandom} from 'react-native-securerandom';

export const generateRandomString = async length => {
  try {
    const byteLength = Math.ceil((length * 256) / 95);
    const bytes = await generateSecureRandom(byteLength);

    const randomString = Array.from(bytes)
      .map(byte => String.fromCharCode((byte % 95) + 32))
      .slice(0, length)
      .join('');

    return randomString;
  } catch (error) {
    console.error('Error generating random string:', error);
    throw error;
  }
};
