import {formatUnits, isAddress, isAddressEqual, parseUnits} from 'viem';

export const USDC_DECIMALS = 6;

// Single-transfer limit enforced by the Send and Request screens
export const MAX_TRANSFER_UNITS = parseUnits('3000', USDC_DECIMALS);

// A positive decimal with at most 6 fractional digits ("5", "5.", ".5", "2.01")
const AMOUNT_PATTERN = /^(\d+(\.\d{0,6})?|\.\d{1,6})$/;

// True while the user is typing something that can still become a valid amount
export const isUsdcAmountInput = input =>
  input === '' || AMOUNT_PATTERN.test(input);

// Converts a typed amount to USDC base units with exact decimal math.
// Returns null for anything that isn't a positive amount with at most 6 decimals,
// rather than letting parseUnits round extra digits.
export const parseUsdcAmount = input => {
  const value = String(input ?? '').trim();
  if (!AMOUNT_PATTERN.test(value)) {
    return null;
  }
  const units = parseUnits(value, USDC_DECIMALS);
  return units > 0n ? units : null;
};

// Formats base units with exactly 2 decimals, rounding down so the app never
// shows more than the wallet holds
export const formatUsdc = units => {
  const cents = BigInt(units) / 10n ** BigInt(USDC_DECIMALS - 2);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
};

// Returns a message explaining why the recipient can't be used, or null if it's fine
export const recipientError = (recipient, sender) => {
  const value = String(recipient ?? '').trim();
  if (!isAddress(value)) {
    return 'Enter a valid Base address: 0x followed by 40 hexadecimal characters. Check for typos.';
  }
  if (sender && isAddress(sender) && isAddressEqual(value, sender)) {
    return 'You cannot send USDC to the account you are sending from.';
  }
  return null;
};

// The message to show when a transfer fails: errors from transferUSDC() marked
// userFacing are already written for users; anything else gets a generic message
export const transferFailureMessage = error =>
  error?.userFacing
    ? error.message
    : 'There was an error and this payment was declined. No USDC was sent.';

// Converts Etherscan-format `tokentx` results (Etherscan V2 and Blockscout) into
// the app's activity items, newest first, plus the USDC moved in the last 24 hours
export const toActivity = (transfers, walletAddress, nowMs = Date.now()) => {
  const dayAgo = nowMs - 24 * 60 * 60 * 1000;
  let dailyUnits = 0n;
  const transactions = transfers.map(transfer => {
    const timeMs = Number(transfer.timeStamp) * 1000;
    const units = BigInt(transfer.value);
    if (timeMs >= dayAgo) {
      dailyUnits += units;
    }
    return {
      age: new Date(timeMs).toISOString(),
      method: isAddressEqual(transfer.to, walletAddress) ? 'IN' : 'OUT',
      value: Number(formatUnits(units, USDC_DECIMALS)),
      hash: transfer.hash,
    };
  });
  transactions.sort((a, b) => b.age.localeCompare(a.age));
  return {transactions, totalTransferred: formatUsdc(dailyUnits)};
};
