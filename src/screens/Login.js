// libraries
import React, {useState, useCallback, useContext} from 'react';
import {View, Image, Platform, ImageBackground} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
// components
import CustomButton from '../components/CustomButton';
import AccountList from '../components/AccountList';
import TooltipComponent from '../components/ToolTip';
import AndroidScanModal from '../components/AndroidScanModal';
// context
import {AccountContext} from '../contexts/AccountContext';
// functions
import {getData} from '../functions/core/asyncStorage';
import {cancelNfc} from '../functions/core/cancelNfcRequest';
import {readCard} from '../functions/core/readCard';
// styles
import styles from '../styles/common';

const Login = ({navigation}) => {
  const {setIsCard} = useContext(AccountContext);

  const [dataList, setDataList] = useState([]);
  const [scanModal, setScanModal] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsCard(true);
      const fetchData = async () => {
        try {
          const data = await getData();
          setDataList(data || []);
        } catch (error) {
          console.error('Error fetching saved accounts:', error);
        }
      };
      fetchData();
    }, [setIsCard]),
  );

  const handleScanCardPress = () => {
    setScanModal(true);
    fetchTag();
  };

  const closeScanModal = () => {
    cancelNfc();
    setScanModal(false);
  };

  const fetchTag = async () => {
    try {
      let result = await readCard();
      if (result.success) {
        setScanModal(false);
        if (result.resultCode === 0) {
          navigation.navigate('AddAccount');
        } else if (result.resultCode === 1) {
          navigation.navigate('CompleteLogin', {data: result.text});
        }
      }
    } catch (error) {
      console.log('Cannot complete fetchTag: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background.png')}
        style={{flex: 1, width: '100%', height: '100%'}}>
        {dataList.length > 0 ? (
          <>
            <View style={{flex: 1, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Press button to scan"
                text="*Requires an NFC Card"
                content="You can make multiple accounts using a single card."
              />
            </View>
            <View style={{flex: 4}}>
              <AccountList
                data={dataList}
                navigation={navigation}
                setData={setDataList}
              />
            </View>
          </>
        ) : (
          <>
            <View style={{flex: 2, margin: 16}}>
              <TooltipComponent
                tooltipVisible={tooltipVisible}
                setTooltipVisible={setTooltipVisible}
                title="Press button to scan"
                text="*Requires an NFC card"
                content="You can make multiple accounts using a single card."
              />
            </View>
            <View style={[{flex: 4}, styles.center]}>
              <Image
                source={require('../assets/card_tap_animation.gif')}
                style={styles.animationContainer}
                resizeMode="contain"
              />
            </View>
          </>
        )}
        <View
          style={[{flex: 2, justifyContent: 'center', gap: 16}, styles.center]}>
          <CustomButton
            text="Scan Card"
            type="primary"
            size="large"
            onPress={handleScanCardPress}
          />
          <CustomButton
            text="Go Back"
            type="secondary"
            size="large"
            onPress={() => {
              navigation.navigate('Landing');
            }}
          />
        </View>
      </ImageBackground>
      {Platform.OS === 'android' && (
        <AndroidScanModal visible={scanModal} closeScanModal={closeScanModal} />
      )}
    </View>
  );
};

export default Login;
