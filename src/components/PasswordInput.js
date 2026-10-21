/////////////////////////////////
// PASSWORD INPUT           /////
//                             //
//                             //
//                             //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

// libraries
import React, {useState} from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {TextInput} from 'react-native-paper';
// components
import Custom from '../components/CustomText';

const PasswordInput = ({text, value, setPassword}) => {
  const [confirmVisible, setConfirmVisible] = useState(true);

  const handleInputChange = text => {
    setPassword(text);
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        theme={{colors: {primary: '#2E3C49'}}}
        keyboardType={
          Platform.OS === 'android' ? 'email-address' : 'ascii-capable'
        }
        returnKeyType="done"
        style={styles.textInput}
        placeholder={text}
        value={value}
        onChangeText={handleInputChange}
        secureTextEntry={confirmVisible}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setConfirmVisible(!confirmVisible)}>
        <Custom
          size="small"
          color="#000000"
          text={confirmVisible ? 'Show' : 'Hide'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    fontSize: 24,
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
  },
  toggleButton: {
    margin: 16,
  },
});

export default PasswordInput;
