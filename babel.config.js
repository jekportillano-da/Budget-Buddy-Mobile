module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Fix for react-native-reanimated/plugin deprecation warning
      'react-native-worklets/plugin',
    ],
  };
};