const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure CSS support for NativeWind
config.resolver.sourceExts.push('css');

// Keep the backend (api/) out of the app bundle
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`^${escapeRegExp(path.join(__dirname, 'api') + path.sep)}`),
];

module.exports = withNativeWind(config, { input: './global.css' });
