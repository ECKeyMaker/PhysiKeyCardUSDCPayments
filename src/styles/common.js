import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  center: {
    alignItems: 'center',
  },
  amountInput: {
    fontSize: 48,
    color: '#000000',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  homeButtons: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 2,
    borderTopColor: 'rgba(23, 23, 23, 0.1)',
  },
  textContainer: {
    flexDirection: 'row',
    margin: 16,
    justifyContent: 'space-between',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 15,
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '85%',
  },
  textInput: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Regular',
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
  },
  tabBarIcon: {
    width: 24,
    height: 24,
    padding: 16,
    resizeMode: 'contain',
  },
  inactiveTabIcon: {
    tintColor: '#909090',
    backgroundColor: '#ffffff',
  },

  // CORE PAGE CONTAINERS
  topContainer: {
    padding: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginLeft: 10,
    width: 24,
    height: 24,
  },
  button: {
    margin: 10,
    borderRadius: 15,
    borderColor: '#2E3C49',
    borderWidth: 1,
    color: '#2E3C49',
  },
});

export default styles;
