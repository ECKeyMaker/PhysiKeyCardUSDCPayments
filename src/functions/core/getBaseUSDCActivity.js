import {
  BASE_USDC_CONTRACT,
  CHAIN_ID,
  ETHERSCAN_API_KEY,
  BLOCKSCOUT_API_URL,
} from '@env';
import {toActivity} from './usdc';

const isConfigured = value => Boolean(value) && !value.startsWith('YOUR_');

// Etherscan V2 (paid plan required for Base) when a key is configured,
// otherwise the free, keyless Blockscout API. Both use the Etherscan response format.
const historyUrl = walletAddress => {
  const query = `module=account&action=tokentx&contractaddress=${BASE_USDC_CONTRACT}&address=${walletAddress}&page=1&offset=100&sort=desc`;
  if (isConfigured(ETHERSCAN_API_KEY)) {
    return `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&${query}&apikey=${ETHERSCAN_API_KEY}`;
  }
  return `${BLOCKSCOUT_API_URL}?${query}`;
};

export const getBaseUSDCActivity = async walletAddress => {
  try {
    const response = await fetch(historyUrl(walletAddress));
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    // "No transactions found" comes back with an empty result array; any other
    // problem (bad key, plan limits, rate limits) comes back as a string
    if (!Array.isArray(data.result)) {
      throw new Error(`History API error: ${data.result || data.message}`);
    }
    return {...toActivity(data.result, walletAddress), error: null};
  } catch (error) {
    console.error('Error fetching USDC transactions:', error);
    return {
      transactions: [],
      totalTransferred: '0.00',
      error: 'Transaction history is unavailable right now.',
    };
  }
};

export const groupDataByMonth = data => {
  const groupedByMonth = data.reduce((acc, item) => {
    const date = new Date(item.age);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthYear = `${month}/${year}`;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {});
  const sortedGroupedByMonth = Object.keys(groupedByMonth).reduce(
    (acc, monthYear) => {
      acc[monthYear] = groupedByMonth[monthYear].sort(
        (a, b) => new Date(b.age) - new Date(a.age),
      );
      return acc;
    },
    {},
  );
  return sortedGroupedByMonth;
};

export const groupDataByDay = data => {
  const groupedByDay = data.reduce((acc, item) => {
    const date = new Date(item.age);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayMonthYear = `${day}/${month}/${year}`;
    if (!acc[dayMonthYear]) {
      acc[dayMonthYear] = [];
    }
    acc[dayMonthYear].push(item);
    return acc;
  }, {});
  const sortedGroupedByDay = Object.keys(groupedByDay).reduce((acc, day) => {
    acc[day] = groupedByDay[day].sort(
      (a, b) => new Date(b.age) - new Date(a.age),
    );
    return acc;
  }, {});
  return sortedGroupedByDay;
};

export const formatDataByMonth = data => {
  const groupedData = groupDataByMonth(data);
  const formattedData = [];
  for (const monthYear in groupedData) {
    formattedData.push({monthYear, data: groupedData[monthYear]});
  }
  return formattedData;
};

export const formatDataByDay = data => {
  const groupedData = groupDataByDay(data);
  const formattedData = [];
  for (const dayMonthYear in groupedData) {
    formattedData.push({dayMonthYear, data: groupedData[dayMonthYear]});
  }
  return formattedData;
};
