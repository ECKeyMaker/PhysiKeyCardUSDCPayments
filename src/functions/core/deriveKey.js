import argon2 from 'react-native-argon2';
import Web3 from 'web3';

// Changing the salt or any derivation step changes every wallet address.
// __tests__/deriveKey.test.js pins known outputs to catch that.
export const salt = 'BklcooclkncUhnaiianhUcnklcooclkB';

export const derivePrivateKey = async (tag, password) => {
  let tempDataChain = tag + password;
  const argonResult = await argon2(tempDataChain, salt, {
    iterations: 4,
    memory: 32768,
    parallelism: 2,
    mode: 'argon2id',
  });
  let finalDataChain = argonResult.rawHash;
  const innerHash = Web3.utils.keccak256(finalDataChain);
  return Web3.utils.keccak256(innerHash + finalDataChain);
};
