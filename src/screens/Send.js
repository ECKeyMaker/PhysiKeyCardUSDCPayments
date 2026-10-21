/////////////////////////////////
// SEND USDC                  ///
// Transfer assets from an     //
// account to another          //
//                             //
// PhysiKeyCard 2024        /////
/////////////////////////////////

// libraries
import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  ImageBackground,
  TextInput,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
// context
import {AccountContext} from '../contexts/AccountContext';
// components
import InputModal from '../components/InputModal';
import AndroidScanModal from '../components/AndroidScanModal';
import CustomButton from '../components/CustomButton';
import Text from '../components/CustomText';
import TooltipComponent from '../components/ToolTip';
import LoadingOverlay from '../components/LoadingOverlay';
// functions
import {accountLogin, transferUSDC} from '../functions/core/accountFunctions';
import {readCard} from '../functions/core/readCard';
import {cancelNfc} from '../functions/core/cancelNfcRequest';
import {
  MAX_TRANSFER_UNITS,
  isUsdcAmountInput,
  parseUsdcAmount,
  recipientError,
  transferFailureMessage,
} from '../functions/core/usdc';
// styles
import styles from '../styles/common';

const Send = ({navigation}) => {
  const {
    publicKey,
    loading,
    setIsLoading,
    setStatusMessage,
    updateAccount,
    isCard,
    dailyAmount,
  } = useContext(AccountContext);

  const [step, setStep] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [tagID, setTagID] = useState('');
  const [recipTag, setRecipTag] = useState('');
  const [scanModal, setScanModal] = useState(false);
  const [recipientKey, setRecipientKey] = useState('');
  const [amount, setAmount] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [success, setSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleNextStep = () => {
    switch (step) {
      case 0: {
        if (recipientKey.trim() === '') {
          setInputError('Please enter a recipient.');
          break;
        }
        const error = recipientError(recipientKey, publicKey);
        if (error) {
          setInputError(error);
        } else {
          setRecipientKey(recipientKey.trim());
          setStep(step + 1);
          setInputError('');
        }
        break;
      }
      case 1: {
        const units = parseUsdcAmount(amount);
        if (units === null) {
          setInputError(
            'Enter an amount greater than 0 with at most 6 decimal places.',
          );
        } else if (units >= MAX_TRANSFER_UNITS) {
          setInputError('Amount cannot be greater than or equal to 3000.');
        } else {
          setStep(step + 1);
          setInputError('');
        }
        break;
      }
      default:
        break;
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleAmountChange = input => {
    setRawInput(input);
    if (isUsdcAmountInput(input)) {
      setAmount(input);
      setInputError('');
    } else {
      setInputError('Please enter a valid number.');
    }
  };

  const closeScanModal = () => {
    cancelNfc();
    setScanModal(false);
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

  const fetchSign = async () => {
    try {
      let result = await readCard();
      let tag = result.text;
      if (tag) {
        setTagID(tag);
        setSignModalVisible(true);
        setScanModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleScanCardPress = () => {
    setScanModal(true);
    fetchTag();
  };

  const handleSignAndSend = () => {
    setScanModal(true);
    fetchSign();
  };

  const handlePasswords = async password => {
    setErrorMessage('');
    setModalVisible(false);
    // Card data is only needed once; don't keep it in screen state
    const card = recipTag;
    setRecipTag('');
    try {
      let account = await accountLogin(card, password);
      setRecipientKey(account.address);
    } catch (error) {
      console.error('Cannot complete handlePasswords: ', error);
    }
  };
  const instantAcceptSign = async () => {
    setErrorMessage('');
    try {
      setIsLoading(true);
      const credentials = await Keychain.getGenericPassword();
      let receipt = await transferUSDC(
        credentials.password,
        credentials.password,
        amount,
        recipientKey,
        {expectedSender: publicKey},
      );
      setStatusMessage(receipt);
      setSuccess(true);
      setIsLoading(false);
      setStep(3);
    } catch (error) {
      console.error('Cannot complete confirmSign: ', error.message);
      setErrorMessage(transferFailureMessage(error));
      setIsLoading(false);
      setSuccess(false);
      setStep(3);
    }
  };

  const confirmSign = async password => {
    setErrorMessage('');
    setSignModalVisible(false);
    // Card data is only needed once; don't keep it in screen state
    const card = tagID;
    setTagID('');
    try {
      setIsLoading(true);
      let receipt = await transferUSDC(card, password, amount, recipientKey, {
        expectedSender: publicKey,
      });
      setStatusMessage(receipt);
      setSuccess(true);
      setIsLoading(false);
      setStep(3);
    } catch (error) {
      console.error('Cannot complete confirmSign: ', error.message);
      setErrorMessage(transferFailureMessage(error));
      setIsLoading(false);
      setSuccess(false);
      setStep(3);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Input recipient address."
                text="*Base network only"
                content="You can paste in this value or use a PhysiKey Card to populate the value. This must be an Ethereum address on the Base network."
              />
            </View>
            <View style={{flex: 4, margin: 16}}>
              <TextInput
                mode="outlined"
                style={styles.textInput}
                theme={{colors: {primary: '#2E3C49'}}}
                placeholder="Recipient Address..."
                value={recipientKey}
                onChangeText={recipientKey => setRecipientKey(recipientKey)}
                returnKeyType={'done'}
              />
              <Text
                size={'large'}
                color={'#000000'}
                text={'or'}
                style={{textAlign: 'center'}}
              />
              <CustomButton
                text="Scan Card"
                type="primary"
                size="large"
                onPress={() => {
                  handleScanCardPress();
                }}
              />
              <Text
                size={'small'}
                color={'#ff0000'}
                text={inputError}
                style={{textAlign: 'center'}}
              />
            </View>
            <View style={{flex: 2}}>
              <View style={styles.buttonContainer}>
                <CustomButton
                  text="Go Back"
                  type="secondary"
                  size="small"
                  onPress={() => {
                    navigation.navigate('Home');
                  }}
                />
                <CustomButton
                  text="Confirm"
                  type="primary"
                  size="small"
                  onPress={handleNextStep}
                />
              </View>
            </View>
          </>
        );
      case 1:
        return (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Input USDC Amount."
                text="*USDC on Base network"
                content="Valid numbers are greater than 0 and formatted correctly."
              />
            </View>
            <View style={{flex: 4, margin: 16}}>
              <View style={{justifyContent: 'center', flexDirection: 'row'}}>
                <TextInput
                  style={styles.amountInput}
                  selectionColor={'#000000'}
                  placeholder="0"
                  value={rawInput}
                  onChangeText={handleAmountChange}
                  returnKeyType={'done'}
                  autoFocus={true}
                  keyboardType={'numeric'}
                />
                <Text size={'large'} color={'#000000'} text={'  USDC'} />
              </View>
              <Text
                size={'small'}
                color={'#ff0000'}
                text={inputError}
                style={{textAlign: 'center'}}
              />
            </View>
            <View style={{flex: 2}}>
              <View style={styles.buttonContainer}>
                <CustomButton
                  text="Go Back"
                  type="secondary"
                  size="small"
                  onPress={() => {
                    Keyboard.dismiss();
                    handlePreviousStep();
                  }}
                />
                <CustomButton
                  text="Continue"
                  type="primary"
                  size="small"
                  onPress={handleNextStep}
                />
              </View>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Review Details."
                content="Verify the details below.  The fee is not calculated into the total."
              />
            </View>
            <View style={{flex: 4, margin: 16}}>
              <View
                style={{
                  justifyContent: 'center',
                  flexDirection: 'row',
                  margin: 16,
                }}>
                <Text size={'xl'} color={'#000000'} text={`${amount} USDC`} />
              </View>
              <Text
                size={'medium'}
                color={'#000000'}
                text={`Will be sent to: ${recipientKey}`}
              />
              <Text
                size={'medium'}
                color={'#000000'}
                text={'The fee for this transaction is 0%'}
              />
            </View>
            <View style={{flex: 2}}>
              <View style={styles.buttonContainer}>
                <CustomButton
                  text="Go Back"
                  type="secondary"
                  size="small"
                  onPress={() => {
                    handlePreviousStep();
                  }}
                />
                <CustomButton
                  text={isCard ? 'Scan Card' : 'Send'}
                  type="primary"
                  size="small"
                  onPress={() => {
                    if (isCard) {
                      handleSignAndSend();
                    } else {
                      instantAcceptSign();
                    }
                  }}
                />
              </View>
            </View>
          </>
        );
      case 3:
        return success ? (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Success!"
                content="Press the account details below to view your account and its details."
              />
            </View>
            <View style={[{flex: 4, margin: 16}, styles.center]}>
              <Image
                source={require('../assets/icons/success.png')}
                style={{width: 128, height: 128}}
              />
              <Text
                size={'medium'}
                color={'#000000'}
                text={
                  'You can now view the transaction in your account details.'
                }
              />
            </View>
            <View style={{flex: 2}}>
              <View style={styles.buttonContainer}>
                <CustomButton
                  text="Return"
                  type="primary"
                  size="small"
                  onPress={() => {
                    setStep(0);
                    setRecipientKey('');
                  }}
                />
                <CustomButton
                  text="Account"
                  type="secondary"
                  size="small"
                  onPress={() => {
                    updateAccount(publicKey);
                    navigation.navigate('Home');
                  }}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Failed!"
                content="The reason is shown below. If you suspect something different please contact us."
              />
            </View>
            <View style={[{flex: 4, margin: 16}, styles.center]}>
              <Image
                source={require('../assets/icons/failure.png')}
                style={{width: 128, height: 128}}
              />
              <Text size={'medium'} color={'#000000'} text={errorMessage} />
            </View>
            <View style={{flex: 2}}>
              <View style={styles.buttonContainer}>
                <CustomButton
                  text="Try Again"
                  type="primary"
                  size="small"
                  onPress={() => setStep(0)}
                />
                <CustomButton
                  text="Account"
                  type="secondary"
                  size="small"
                  onPress={() => {
                    updateAccount(publicKey);
                    navigation.navigate('Home');
                  }}
                />
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ImageBackground
        source={require('../assets/background.png')}
        style={{flex: 1, width: '100%', height: '100%'}}>
        <LoadingOverlay loading={loading} />
        {parseFloat(dailyAmount) >= 10000 ? (
          <View style={{alignItems: 'center', margin: 16}}>
            <Text
              size={'medium'}
              color={'#ff0000'}
              text="You have hit your daily transaction limit, please try again later."
            />
          </View>
        ) : (
          renderStep()
        )}
      </ImageBackground>

      <InputModal
        visible={modalVisible}
        closeModal={() => {
          setModalVisible(false);
          setRecipTag('');
        }}
        handlePasswords={handlePasswords}
        title="Enter your password."
      />
      <InputModal
        visible={signModalVisible}
        closeModal={() => {
          setSignModalVisible(false);
          setTagID('');
        }}
        handlePasswords={confirmSign}
        title="Enter your password."
      />
      {Platform.OS === 'android' && ( // Render modal only on Android
        <AndroidScanModal visible={scanModal} closeScanModal={closeScanModal} />
      )}
    </>
  );
};

export default Send;
