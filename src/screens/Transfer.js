// libraries
import React, {useState, useContext, useCallback} from 'react';
import {View, ImageBackground, Platform} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useFocusEffect} from '@react-navigation/native';
// context
import {AccountContext} from '../contexts/AccountContext';
// components
import ZeroFee from './ZeroFee';
import AndroidScanModal from '../components/AndroidScanModal';
import CustomButton from '../components/CustomButton';
import InputModal from '../components/InputModal';
import Text from '../components/CustomText';
// functions
import {accountLogin} from '../functions/core/accountFunctions';
import {cancelNfc} from '../functions/core/cancelNfcRequest';
import {readCard} from '../functions/core/readCard';

// components
import TransferTutorial from '../components/TransferTutorial';
// styles
import styles from '../styles/common';

const Tab = createMaterialTopTabNavigator();

const Transfer = () => {
  const {publicKey, isCard} = useContext(AccountContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [scanModal, setScanModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recipTag, setRecipTag] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  // Which account was last verified, and when; a verification only counts for that account
  const [verification, setVerification] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      const recentlyVerified =
        verification &&
        verification.address === publicKey &&
        Date.now() - verification.time < fiveMinutes;
      if (!isCard || recentlyVerified) {
        setIsVerified(true);
        setErrorMessage('');
      } else {
        setIsVerified(false);
        setErrorMessage(
          'To make sure you have the correct card account, verify the card and password combination.',
        );
      }
      return () => {
        setIsVerified(false);
      };
    }, [isCard, publicKey, verification]),
  );

  const closeScanModal = () => {
    cancelNfc();
    setScanModal(false);
  };

  const startVerificationProcess = () => {
    setScanModal(true);
    fetchTag();
  };

  const fetchTag = async () => {
    try {
      let result = await readCard();
      let tag = result.text;
      if (tag) {
        setRecipTag(tag);
        setModalVisible(true);
        setScanModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRecipPassword = async password => {
    setErrorMessage('');
    // Card data is only needed once; don't keep it in screen state
    const card = recipTag;
    setRecipTag('');
    try {
      let account = await accountLogin(card, password);
      console.log('Your verified address: ', account.address);
      if (account.address === publicKey) {
        setVerification({address: publicKey, time: Date.now()});
        setIsVerified(true);
        setModalVisible(false);
        setErrorMessage('');
      } else {
        setModalVisible(false);
        setErrorMessage(
          'This is not the correct card/password combination. Please Try again',
        );
      }
    } catch (error) {
      console.error('Cannot complete handlePasswords: ', error);
    }
  };

  const handleModalClose = () => {
    setRecipTag('');
    if (!isVerified) {
      setModalVisible(false);
      setScanModal(true);
    }
  };

  const renderTabs = () => {
    if (isCard) {
      return (
        <>
          <ImageBackground
            source={require('../assets/background.png')}
            style={{flex: 1, width: '100%', height: '100%'}}>
            <View style={{flex: 1}}>
              {isVerified ? (
                <Tab.Navigator
                  screenOptions={{
                    tabBarIndicatorStyle: {backgroundColor: '#2E3C49'},
                    tabBarLabelStyle: {
                      fontFamily: 'LeagueSpartan-Regular',
                      fontSize: 24,
                      textTransform: 'none',
                    },
                  }}>
                  <Tab.Screen name="No Fees" component={ZeroFee} />
                </Tab.Navigator>
              ) : (
                <>
                  <View style={[{flex: 2, marginTop: 64}]}>
                    <TransferTutorial />
                  </View>

                  <View style={[{flex: 2}, styles.center]}>
                    <CustomButton
                      text="Verify Account"
                      type="primary"
                      size="large"
                      onPress={startVerificationProcess}
                      style={{marginVertical: 16}}
                    />
                    <Text
                      size={'small'}
                      color={'#ff0000'}
                      text={errorMessage}
                      style={{textAlign: 'center', marginHorizontal: 16}}
                    />
                  </View>
                </>
              )}
            </View>

            <InputModal
              visible={modalVisible}
              closeModal={handleModalClose}
              handlePasswords={handleRecipPassword}
              title="Confirm your password."
              errorMessage={errorMessage}
            />
            {Platform.OS === 'android' && (
              <AndroidScanModal
                visible={scanModal}
                closeScanModal={closeScanModal}
                changeGifSource={null}
                fetchTag={fetchTag}
              />
            )}
          </ImageBackground>
        </>
      );
    } else {
      return (
        <>
          <ImageBackground
            source={require('../assets/background.png')}
            style={{flex: 1, width: '100%', height: '100%'}}>
            <View style={{flex: 1}}>
              <Tab.Navigator
                screenOptions={{
                  tabBarIndicatorStyle: {backgroundColor: '#2E3C49'},
                  tabBarLabelStyle: {
                    fontFamily: 'LeagueSpartan-Regular',
                    fontSize: 24,
                    textTransform: 'none',
                  },
                }}>
                <Tab.Screen name="No Fees" component={ZeroFee} />
              </Tab.Navigator>
            </View>

            <InputModal
              visible={modalVisible}
              closeModal={handleModalClose}
              handlePasswords={handleRecipPassword}
              title="Confirm your password."
              errorMessage={errorMessage}
            />
            {Platform.OS === 'android' && (
              <AndroidScanModal
                visible={scanModal}
                closeScanModal={closeScanModal}
                changeGifSource={null}
                fetchTag={fetchTag}
              />
            )}
          </ImageBackground>
        </>
      );
    }
  };

  return renderTabs();
};

export default Transfer;
