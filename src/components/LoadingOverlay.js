/////////////////////////////////
// LOADING OVERLAY          /////
// Full page overlay           //
// When context loading is true//
// this blocks other content   //
// until loaded                //
// PhysiKeyCard 2024           //
/////////////////////////////////

import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

const LoadingOverlay = ({loading}) => {
  if (!loading) return null;
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require('../assets/physikey_card_loading_animation.gif')}
        style={styles.loadingSpinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1.0)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  loadingSpinner: {
    width: 128,
    height: 128,
    marginBottom: 128,
  },
});

export default LoadingOverlay;
