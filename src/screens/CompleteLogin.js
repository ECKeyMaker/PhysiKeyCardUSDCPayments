/////////////////////////////////
// ADDACCOUNT PAGE //////////////
// Users can add a new account //
// by scanning their card,     //
// naming their account,       //
// and setting a password      //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  KeyboardAvoidingView,
  ImageBackground,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import emojiRegex from 'emoji-regex';
// context
import {AccountContext} from '../contexts/AccountContext';
// components
import CustomButton from '../components/CustomButton';
import PasswordInput from '../components/PasswordInput';
import Text from '../components/CustomText';
import LoadingOverlay from '../components/LoadingOverlay';
import TooltipComponent from '../components/ToolTip';
// styles
import styles from '../styles/common';

const CompleteLogin = ({navigation, route}) => {
  const {loading, setNewAccount} = useContext(AccountContext);
  const {data} = route.params;
  const regex = emojiRegex();

  const [step, setStep] = useState(0);
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [label, setLabel] = useState('');
  const [inputError, setInputError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  const handleNextStep = async () => {
    switch (step) {
      case 0:
        if (password && password.trim() !== '') {
          if (regex.test(password)) {
            setInputError('Emoji characters are not allowed.');
            return;
          }
          if (password.length < 4) {
            setInputError('Passwords must be at least 4 characters.');
            return;
          }
          if (confirmPassword && confirmPassword.trim() !== '') {
            if (password === confirmPassword) {
              setNewAccount(data, password, label, navigation);
              setInputError('');
            } else {
              setInputError('The passwords do not match.');
            }
          } else {
            setInputError('Please confirm your password.');
          }
        } else {
          setInputError('Please enter a password.');
        }
        break;
      case 1:
        if (label.trim() !== '') {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const items = await AsyncStorage.multiGet(keys);
            const accountNames = items.map(item => item[0]);
            const inputName = label;
            const isDuplicate = accountNames.includes(inputName);
            if (isDuplicate) {
              setInputError(
                'This name is already being used on this device. Please try another name.',
              );
              return;
            }
            setInputError('');
            setNewAccount(data, password, label, navigation);
          } catch (error) {
            console.error(
              'Error retrieving accounts from AsyncStorage:',
              error,
            );
          }
        } else {
          setInputError('Please enter a name.');
        }
        break;
      default:
        break;
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
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
                title="Login"
                text="*Login using your password"
                content="Passwords must be 4 characters and may not contain emoji's.  It is important you remember this password."
              />
            </View>
            <View style={{flex: 5, margin: 16}}>
              <PasswordInput
                text="Enter Password..."
                password={password}
                setPassword={setPassword}
              />
              <PasswordInput
                text="Confirm Password..."
                password={confirmPassword}
                setPassword={setConfirmPassword}
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
                    navigation.navigate('Login');
                  }}
                />
                <CustomButton
                  text="Login"
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
                title="Name this account"
                content="Names can be any length or character but must be unique."
              />
            </View>
            <View style={{flex: 4, margin: 16}}>
              <TextInput
                mode="outlined"
                theme={{colors: {primary: '#2E3C49'}}}
                returnKeyType="done"
                style={styles.textInput}
                placeholder={'Enter name...'}
                value={label}
                onChangeText={setLabel}
                autoCapitalize="none"
                onSubmitEditing={handleNextStep}
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
                  onPress={handlePreviousStep}
                />
                <CustomButton
                  text="Login"
                  type="primary"
                  size="small"
                  onPress={() => {
                    Keyboard.dismiss();
                    handleNextStep();
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
        {renderStep()}
      </ImageBackground>
    </>
  );
};

export default CompleteLogin;
