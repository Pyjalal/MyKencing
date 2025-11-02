const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure for web support
config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: false,
});
