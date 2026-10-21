import {http, createPublicClient} from 'viem';
import {BASE_USDC_CONTRACT, RPC_URL} from '@env';
import {formatUsdc} from './usdc';

const abi = [
  {
    constant: true,
    inputs: [{name: '_owner', type: 'address'}],
    name: 'balanceOf',
    outputs: [{name: 'balance', type: 'uint256'}],
    type: 'function',
  },
];

// Exact balance in USDC base units (6 decimals)
export const getUSDCBalanceUnits = async address => {
  const client = createPublicClient({
    transport: http(RPC_URL),
  });
  return client.readContract({
    abi: abi,
    address: BASE_USDC_CONTRACT,
    functionName: 'balanceOf',
    args: [address],
  });
};

export const getUSDCBalance = async address => {
  try {
    return formatUsdc(await getUSDCBalanceUnits(address));
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    throw error;
  }
};
