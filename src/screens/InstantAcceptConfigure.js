import React, {useState, useContext} from 'react';
import {View, ImageBackground} from 'react-native';
import * as Keychain from 'react-native-keychain';
// context
import {AccountContext} from '../contexts/AccountContext';
// components
import CustomButton from '../components/CustomButton';
import Text from '../components/CustomText';
import TooltipComponent from '../components/ToolTip';
import LoadingOverlay from '../components/LoadingOverlay';
import WarningModal from '../components/WarningModal';
// functions
import {accountLogin} from '../functions/core/accountFunctions';
import {generateRandomString} from '../functions/core/generateRandomString';
// styles
import styles from '../styles/common';

const InstantAcceptConfigure = ({navigation}) => {
  const {
    setIsLoading,
    loading,
    setNewPublicKey,
    setNewBalance,
    publicKey,
    updateAccount,
  } = useContext(AccountContext);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const initializeAccount = async () => {
    const username = 'Default';
    const password = await generateRandomString(70);
    try {
      setIsLoading(true);
      console.log('Creating a new account...');
      await Keychain.setGenericPassword(username, password);
      const account = await accountLogin(password, password);
      setNewPublicKey(account.address);
      setNewBalance(account.address);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error initializing account: ', error);
      navigation.navigate('Landing');
    }
  };

  const handleConfirm = () => {
    initializeAccount();
    setModalVisible(false);
  };

  return (
    <>
      <ImageBackground
        source={require('../assets/background.png')}
        style={{flex: 1, width: '100%', height: '100%'}}>
        <LoadingOverlay loading={loading} />
        <View style={{flex: 2, margin: 16}}>
          <TooltipComponent
            tooltipVisible={tooltipVisible}
            setTooltipVisible={setTooltipVisible}
            title="Generate new address"
            content="You will not be able to access your old account.  Proceed with caution."
          />
        </View>
        <View
          style={[
            {flex: 4, margin: 16, justifyContent: 'center'},
            styles.center,
          ]}>
          <Text size={'medium'} color={'#000000'} text={'Your address: '} />
          <Text size={'small'} color={'#000000'} text={publicKey} />
          <Text
            size={'medium'}
            color={'#000000'}
            text={
              'Generating a new address will overwrite your previous account. '
            }
          />
          <CustomButton
            text="Generate"
            type="primary"
            size="large"
            onPress={() => setModalVisible(true)}
            style={{marginVertical: 16}}
          />
        </View>
        <View style={{flex: 2}}>
          <View style={styles.buttonContainer}>
            <CustomButton
              text="Go Back"
              type="primary"
              size="large"
              onPress={() => {
                navigation.navigate('Home');
                updateAccount(publicKey);
              }}
            />
          </View>
        </View>

        <WarningModal
          visible={modalVisible}
          closeModal={() => setModalVisible(false)}
          handleConfirm={handleConfirm}
        />
      </ImageBackground>
    </>
  );
};

export default InstantAcceptConfigure;
