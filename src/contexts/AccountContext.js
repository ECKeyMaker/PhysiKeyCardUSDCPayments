// libraries
import React, {createContext, useState} from 'react';
// functions
import {storeData} from '../functions/core/asyncStorage';
import {accountLogin} from '../functions/core/accountFunctions';
import {getUSDCBalance} from '../functions/core/getBaseUSDC';
import {getBaseUSDCActivity} from '../functions/core/getBaseUSDCActivity';

export const AccountContext = createContext();

const AccountContextProvider = props => {
  const [publicKey, setPublicKey] = useState('');
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('');
  const [status, setStatus] = useState('');
  const [dailyAmount, setDailyAmount] = useState();
  const [activity, setActivity] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCard, setIsCard] = useState(false);

  const setNewAccount = async (tag, password, name, navigation) => {
    try {
      setLoading(true);
      let account = await accountLogin(tag, password);
      let fetchedBalance = await getUSDCBalance(account.address);
      let {
        transactions: fetchedActivity,
        totalTransferred,
        error: fetchedHistoryError,
      } = await getBaseUSDCActivity(account.address);
      if (fetchedBalance === '0.') {
        setBalance('0.0');
      } else {
        setBalance(fetchedBalance);
      }
      setDailyAmount(totalTransferred);
      setActivity(fetchedActivity);
      setHistoryError(fetchedHistoryError);
      setPublicKey(account.address);
      setAccountName(name);
      // Only named accounts go in the saved list; users can name this one later with Save Account
      if (name && name.trim() !== '') {
        await storeData(name, account.address);
      }
      // Replace the history instead of pushing Home on top of it, so the login screens,
      // which hold the card entropy and password, are unmounted and released
      navigation.reset({
        index: 1,
        routes: [{name: 'Landing'}, {name: 'Home'}],
      });
      setLoading(false);
    } catch (error) {
      console.error('Cannot complete setNewAccount: ', error);
      setStatus(error);
      navigation.navigate('Login');
      setLoading(false);
    }
  };

  const updateAccount = async address => {
    setNewBalance(address);
    setNewActivity(address);
  };

  const setNewBalance = async address => {
    try {
      let fetchedBalance = await getUSDCBalance(address);
      if (fetchedBalance === '0.') {
        setBalance('0.0');
      } else {
        setBalance(fetchedBalance);
      }
    } catch (error) {
      console.error('Cannot complete fetchBalance: ', error);
      setStatus(error);
    }
  };

  const setNewActivity = async address => {
    try {
      let {
        transactions: fetchedActivity,
        totalTransferred,
        error: fetchedHistoryError,
      } = await getBaseUSDCActivity(address);
      setActivity(fetchedActivity);
      setDailyAmount(totalTransferred);
      setHistoryError(fetchedHistoryError);
    } catch (error) {
      console.error('Cannot complete fetchActivity: ', error);
      setStatus(error);
    }
  };

  const setNewCard = async isCard => {
    setIsCard(isCard);
  };

  const setNewName = async name => {
    setAccountName(name);
  };

  const setNewPublicKey = address => {
    setPublicKey(address);
  };

  const setStatusMessage = message => {
    setStatus(message);
  };

  const setIsLoading = value => {
    setLoading(value);
  };

  return (
    <AccountContext.Provider
      value={{
        publicKey,
        activity,
        historyError,
        accountName,
        balance,
        status,
        loading,
        isCard,
        dailyAmount,
        setNewAccount,
        setStatusMessage,
        setNewBalance,
        setIsLoading,
        setNewName,
        setNewPublicKey,
        setNewActivity,
        setIsCard,
        updateAccount,
        setNewCard,
      }}>
      {props.children}
    </AccountContext.Provider>
  );
};

export default AccountContextProvider;
