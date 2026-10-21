import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import Text from '../components/CustomText';
import Tooltip from 'react-native-walkthrough-tooltip';

const TooltipComponent = ({
  tooltipVisible,
  setTooltipVisible,
  title,
  text,
  content,
}) => (
  <>
    <TouchableOpacity
      style={styles.topContainer}
      onPress={() => setTooltipVisible(true)}>
      <Text
        size={'large'}
        color={'#000000'}
        text={title}
        style={{width: '90%'}}
      />
      <Image source={require('../assets/icons/info.png')} style={styles.icon} />
    </TouchableOpacity>
    <Tooltip
      isVisible={tooltipVisible}
      content={<Text size={'small'} color={'#000000'} text={content} />}
      placement="bottom"
      onClose={() => setTooltipVisible(false)}>
      <View />
    </Tooltip>
    <Text size={'small'} color={'#000000'} text={text} />
  </>
);

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  icon: {
    marginLeft: 10,
    width: 24,
    height: 24,
  },
});

export default TooltipComponent;
