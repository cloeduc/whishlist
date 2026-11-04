// Metro also reads files of the site, single sources: strings (../locales), i18n configuration
// (../src/i18n, R8), pure rules shared with the app (../src/domain: identifier format, theme)
// and site constants (../src/site/contact.ts).
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, "../locales"),
  path.resolve(__dirname, "../src/i18n"),
  path.resolve(__dirname, "../src/domain"),
  path.resolve(__dirname, "../src/site"),
];

module.exports = config;
