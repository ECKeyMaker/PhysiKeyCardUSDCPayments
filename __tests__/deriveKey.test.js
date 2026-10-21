/**
 * Pins the card + password → private key derivation.
 *
 * If this test fails, a change (code, salt, Argon2 parameters or a dependency
 * upgrade) would give every existing user a different wallet address. Do not
 * update these values unless you intend to break compatibility with existing cards.
 *
 * react-native-argon2 is native code, so it is replaced here with hash-wasm,
 * which produces identical output: UTF-8 input, Argon2 v1.3, 32-byte hash,
 * lowercase hex. The Argon2 outputs below were also cross-checked against the
 * reference C implementation (argon2-cffi).
 */
import {privateKeyToAccount} from 'viem/accounts';
import {derivePrivateKey, salt} from '../src/functions/core/deriveKey';

jest.mock('react-native-argon2', () => ({
  __esModule: true,
  default: async (password, saltValue, config) => ({
    rawHash: await require('hash-wasm').argon2id({
      password,
      salt: saltValue,
      iterations: config.iterations,
      memorySize: config.memory,
      parallelism: config.parallelism,
      hashLength: 32,
      outputType: 'hex',
    }),
  }),
}));

const CARD = 'a3f1c2d4e5b60718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f809';

const vectors = [
  {
    tag: CARD,
    password: '1234',
    privateKey:
      '0x25607f0ab5427256af264fe50670c8681cebf39734ebce2219d5e45d6198ca7a',
    address: '0x807Da2FE81BC35C39bBE2B6cF9ff0E0b3699568B',
  },
  {
    tag: CARD,
    password: 'correct horse battery staple',
    privateKey:
      '0x19e9ba36a7cc6179c278553af732e3ca3a2d49d187adb9386c3db38e7b4d9f07',
    address: '0x1Bdf0A3887dd0a9e762105A8f2978854b17b8A48',
  },
  {
    tag: '00000000000000000000000000000000000000000000000000000000000000ff',
    password: 'pässwörd-✓',
    privateKey:
      '0xc8a933744a5b26981b03ed574f64a3549438d253a33e29fb4ee777514491c31c',
    address: '0xeD67c7FeDc70abc42011eD6C5f4a2Fc650586a2b',
  },
];

describe('derivePrivateKey', () => {
  it('uses the published salt', () => {
    expect(salt).toBe('BklcooclkncUhnaiianhUcnklcooclkB');
  });

  it.each(vectors)(
    'derives the pinned key for password "$password"',
    async ({tag, password, privateKey, address}) => {
      const derived = await derivePrivateKey(tag, password);
      expect(derived).toBe(privateKey);
      expect(privateKeyToAccount(derived).address).toBe(address);
    },
  );

  it('gives a different key for a different password on the same card', async () => {
    const a = await derivePrivateKey(CARD, '1234');
    const b = await derivePrivateKey(CARD, '1235');
    expect(a).not.toBe(b);
  });
});
