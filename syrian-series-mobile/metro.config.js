const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force Metro to resolve the 'react-native' field in package.json
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;
