module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel',
    ],
    plugins: [
      // NOTE: This plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
