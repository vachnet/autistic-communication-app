const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// File crawling works in restricted runners without a user-level Watchman daemon.
config.resolver.useWatchman = false;
module.exports = config;
