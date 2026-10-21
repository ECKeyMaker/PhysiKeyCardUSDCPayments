/////////////////////////////////
//CUSTOM TEXT COMPONENT   ///////
// Handles rendering custom    //
// font                        //
//                             //
//                             //
// PhysiKeyCard 2024           //
/////////////////////////////////

import React from 'react';
import {Text} from 'react-native';

const CustomText = ({size, color, text, style}) => {
  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return {fontSize: 16, fontFamily: 'LeagueSpartan-Regular'};
      case 'medium':
        return {fontSize: 24, fontFamily: 'LeagueSpartan-SemiBold'};
      case 'large':
        return {fontSize: 32, fontFamily: 'LeagueSpartan-Regular'};
      case 'xl':
        return {fontSize: 48, fontFamily: 'LeagueSpartan-Regular'};
      default:
        return {fontSize: 16, fontFamily: 'LeagueSpartan-SemiBold'};
    }
  };
  return <Text style={[getTextStyle(), {color}, style]}>{text}</Text>;
};

export default CustomText;
