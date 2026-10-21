import './global';
import * as React from 'react';
import AppNavigator from './src/components/AppNavigator.js';
import 'whatwg-fetch';

const App = () => {
  if (!__DEV__) {
    console.log = () => {};
  }

  return <AppNavigator />;
};

export default App;
