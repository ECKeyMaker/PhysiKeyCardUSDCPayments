import {
  MAX_TRANSFER_UNITS,
  formatUsdc,
  isUsdcAmountInput,
  parseUsdcAmount,
  recipientError,
  toActivity,
  transferFailureMessage,
} from '../src/functions/core/usdc';

describe('parseUsdcAmount', () => {
  it('converts amounts exactly, without floating-point loss', () => {
    // Number('2.01') * 1e6 is 2009999.9999999998, which the old code floored to 2.009999 USDC
    expect(parseUsdcAmount('2.01')).toBe(2010000n);
    expect(parseUsdcAmount('0.29')).toBe(290000n);
    expect(parseUsdcAmount('5.')).toBe(5000000n);
    expect(parseUsdcAmount('.5')).toBe(500000n);
    expect(parseUsdcAmount('0.000001')).toBe(1n);
  });

  it('rejects zero, negative, malformed and over-precise amounts', () => {
    for (const bad of [
      '',
      '0',
      '0.0',
      '0.0000001',
      '1.1234567',
      '-1',
      '1e3',
      'abc',
      '.',
      ' ',
    ]) {
      expect(parseUsdcAmount(bad)).toBeNull();
    }
  });

  it('defines the transfer limit as 3,000 USDC', () => {
    expect(MAX_TRANSFER_UNITS).toBe(3000000000n);
  });
});

describe('isUsdcAmountInput', () => {
  it('accepts partial input while typing and rejects anything else', () => {
    for (const ok of ['', '1', '1.', '1.5', '.5', '123.456789']) {
      expect(isUsdcAmountInput(ok)).toBe(true);
    }
    for (const bad of ['1.1234567', 'abc', '1,5', '1e3', '-1']) {
      expect(isUsdcAmountInput(bad)).toBe(false);
    }
  });
});

describe('formatUsdc', () => {
  it('shows two decimals and rounds down, never up', () => {
    expect(formatUsdc(1999999n)).toBe('1.99');
    expect(formatUsdc(2000000n)).toBe('2.00');
    expect(formatUsdc(9999n)).toBe('0.00');
    expect(formatUsdc(0n)).toBe('0.00');
    expect(formatUsdc(1234567890n)).toBe('1234.56');
  });
});

describe('recipientError', () => {
  const sender = '0xA849bbaD82F9edafDf9A5550CC874276138779d9';

  it('accepts valid addresses, including lowercase and surrounding spaces', () => {
    expect(
      recipientError('0x807Da2FE81BC35C39bBE2B6cF9ff0E0b3699568B', sender),
    ).toBeNull();
    expect(
      recipientError(' 0x807da2fe81bc35c39bbe2b6cf9ff0e0b3699568b ', sender),
    ).toBeNull();
  });

  it('rejects malformed addresses and bad checksums', () => {
    expect(recipientError('0x1234', sender)).toMatch(/valid Base address/);
    expect(recipientError('hello', sender)).toMatch(/valid Base address/);
    // Mixed case with one character's case flipped: a likely typo
    expect(
      recipientError('0x807Da2FE81BC35C39bBE2B6cF9ff0E0b3699568b', sender),
    ).toMatch(/valid Base address/);
  });

  it('rejects sending to yourself, in any letter case', () => {
    expect(recipientError(sender.toLowerCase(), sender)).toMatch(
      /own account|sending from/,
    );
  });
});

describe('toActivity', () => {
  const wallet = '0xA849bbaD82F9edafDf9A5550CC874276138779d9'; // checksummed, like the app's publicKey
  const now = 1792602100 * 1000;
  // First three entries are a real Blockscout Base Sepolia response (lowercase addresses)
  const transfers = [
    {
      timeStamp: '1792602096',
      from: '0xc5a1cc12057c5fc55a5f8dfd9427b19f1f94a0e8',
      to: '0xa849bbad82f9edafdf9a5550cc874276138779d9',
      value: '2000',
      hash: '0x38a3',
    },
    {
      timeStamp: '1792602094',
      from: '0xa31ff433e9b2da109ed9cd8d292341a14e92dea7',
      to: '0xa849bbad82f9edafdf9a5550cc874276138779d9',
      value: '1000000',
      hash: '0x62c5',
    },
    {
      timeStamp: '1792602092',
      from: '0xc5a1cc12057c5fc55a5f8dfd9427b19f1f94a0e8',
      to: '0xa849bbad82f9edafdf9a5550cc874276138779d9',
      value: '1000',
      hash: '0x75db',
    },
    // An outgoing transfer inside the last 24 hours
    {
      timeStamp: '1792598500',
      from: '0xa849bbad82f9edafdf9a5550cc874276138779d9',
      to: '0x807da2fe81bc35c39bbe2b6cf9ff0e0b3699568b',
      value: '2010000',
      hash: '0x0ut1',
    },
    // An incoming transfer from two days ago, outside the window
    {
      timeStamp: String(1792602100 - 2 * 86400),
      from: '0x807da2fe81bc35c39bbe2b6cf9ff0e0b3699568b',
      to: '0xa849bbad82f9edafdf9a5550cc874276138779d9',
      value: '50000000',
      hash: '0x01d1',
    },
  ];

  it('labels direction case-insensitively and converts values to USDC', () => {
    const {transactions} = toActivity(transfers, wallet, now);
    expect(transactions.map(t => t.method)).toEqual([
      'IN',
      'IN',
      'IN',
      'OUT',
      'IN',
    ]);
    expect(transactions.map(t => t.value)).toEqual([0.002, 1, 0.001, 2.01, 50]);
  });

  it('sorts newest first and sums only the last 24 hours', () => {
    const {transactions, totalTransferred} = toActivity(
      [...transfers].reverse(),
      wallet,
      now,
    );
    expect(transactions[0].hash).toBe('0x38a3');
    expect(transactions[transactions.length - 1].hash).toBe('0x01d1');
    // 0.002 + 1 + 0.001 + 2.01 = 3.013, shown rounded down
    expect(totalTransferred).toBe('3.01');
  });

  it('handles an account with no transfers', () => {
    expect(toActivity([], wallet, now)).toEqual({
      transactions: [],
      totalTransferred: '0.00',
    });
  });
});

describe('transferFailureMessage', () => {
  it('shows messages written for users and hides technical ones', () => {
    expect(
      transferFailureMessage(
        Object.assign(new Error('Not enough USDC.'), {userFacing: true}),
      ),
    ).toBe('Not enough USDC.');
    expect(
      transferFailureMessage(
        new Error('HTTP request failed. URL: https://api.pimlico.io/...'),
      ),
    ).toMatch(/declined. No USDC was sent/);
  });
});
