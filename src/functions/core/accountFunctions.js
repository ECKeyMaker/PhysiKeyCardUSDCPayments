import {toSimpleSmartAccount} from 'permissionless/_esm/accounts';
import {
  createPublicClient,
  http,
  encodeFunctionData,
  isAddress,
  isAddressEqual,
} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {entryPoint07Address} from 'viem/account-abstraction';
import {base, baseSepolia} from 'viem/chains';
import {createPimlicoClient} from 'permissionless/_esm/clients/pimlico';
import {createSmartAccountClient} from 'permissionless/_esm/';

import {derivePrivateKey} from './deriveKey';
import {getUSDCBalanceUnits} from './getBaseUSDC';
import {parseUsdcAmount} from './usdc';

import {
  BASE_USDC_CONTRACT,
  PIMLICO_RPC_URL,
  CHAIN_ID,
  RPC_URL,
  ACCOUNT_FACTORY_ADDRESS,
} from '@env';
const chain = Number(CHAIN_ID) === base.id ? base : baseSepolia;
const abi = [
  {
    inputs: [
      {internalType: 'address', name: 'to', type: 'address'},
      {internalType: 'uint256', name: 'value', type: 'uint256'},
    ],
    name: 'transfer',
    outputs: [{internalType: 'bool', name: '', type: 'bool'}],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'account', type: 'address'}],
    name: 'balanceOf',
    outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{internalType: 'uint8', name: '', type: 'uint8'}],
    stateMutability: 'view',
    type: 'function',
  },
];

const factoryAddress = ACCOUNT_FACTORY_ADDRESS;
const pimlicoUrl = PIMLICO_RPC_URL;

export const accountLogin = async (tag, password) => {
  try {
    let privateKey = await derivePrivateKey(tag, password);

    const publicClient = createPublicClient({
      chain: chain,
      transport: http(RPC_URL),
    });

    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: privateKeyToAccount(privateKey),
      entryPoint: {
        // optional, defaults to 0.7
        address: entryPoint07Address,
        version: '0.7',
      },
      // permissionless's option is `factoryAddress`; an unknown key like `factory` is
      // silently ignored. Changing this address changes every user's wallet address.
      factoryAddress: factoryAddress,
    });

    return simpleAccount;
  } catch (error) {
    console.log('Error logging in or creating account:', error);
    throw error;
  }
};

// How long to wait for the bundler to include a transfer before telling the user to check history
const RECEIPT_TIMEOUT_MS = 120000;

// Errors whose message is written for the user and can be shown on screen as-is
const userFacingError = message =>
  Object.assign(new Error(message), {userFacing: true});

// expectedSender: when set, refuse to send unless the card + password derive this
// address, so a mistyped password or the wrong card can't sign from another wallet
export const transferUSDC = async (
  tag,
  password,
  amount,
  recipient,
  {expectedSender} = {},
) => {
  const units = parseUsdcAmount(amount);
  if (units === null) {
    throw userFacingError(
      'Enter an amount greater than 0 with at most 6 decimal places.',
    );
  }
  if (!isAddress(recipient)) {
    throw userFacingError('The recipient address is not valid.');
  }
  let simpleAccount = await accountLogin(tag, password);
  if (
    expectedSender &&
    !isAddressEqual(simpleAccount.address, expectedSender)
  ) {
    throw userFacingError(
      "That card or password doesn't match the account you're signed in to. No USDC was sent.",
    );
  }
  const balance = await getUSDCBalanceUnits(simpleAccount.address);
  if (balance < units) {
    throw userFacingError(
      expectedSender
        ? 'Not enough USDC in this account. No USDC was sent.'
        : 'Not enough USDC on this card, or the PIN was entered incorrectly. No USDC was sent.',
    );
  }
  try {
    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7',
      },
    });

    const smartAccountClient = createSmartAccountClient({
      account: simpleAccount, // Ensure this is set
      chain: chain,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await pimlicoClient.getUserOperationGasPrice()).fast;
        },
      },
    });

    // Encode the data for the transfer function
    const data = encodeFunctionData({
      abi: abi,
      functionName: 'transfer',
      args: [recipient, units],
    });
    const userOpHash = await smartAccountClient.sendUserOperation({
      calls: [
        {
          to: BASE_USDC_CONTRACT, // USDC contract address
          value: 0n, // No Ether is sent (USDC is an ERC-20 token)
          data: data, // Data to call transfer method in the USDC contract
        },
      ],
    });

    let receipt;
    try {
      receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: RECEIPT_TIMEOUT_MS,
      });
    } catch (error) {
      if (error?.name === 'WaitForUserOperationReceiptTimeoutError') {
        // The transfer may still go through, so don't report it as failed
        throw userFacingError(
          'The transfer was submitted but is not confirmed yet. Check your transaction history before trying again.',
        );
      }
      throw error;
    }
    // Inclusion alone isn't success: the USDC transfer inside the operation can still revert
    if (!receipt.success) {
      throw userFacingError(
        `The transfer was rejected on-chain${
          receipt.reason ? ` (${receipt.reason})` : ''
        }. No USDC was sent.`,
      );
    }

    const txHash = receipt.receipt.transactionHash;
    console.log(
      `User operation included: ${chain.blockExplorers.default.url}/tx/${txHash}`,
    );
    return txHash;
  } catch (error) {
    console.error('Error during USDC transfer:', error);
    throw error;
  }
};
