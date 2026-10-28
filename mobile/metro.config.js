// Metro lit aussi des fichiers du site, sources uniques : textes (../locales), configuration i18n
// (../src/i18n, R8) et règles pures partagées avec l'app (../src/domain : format des identifiants, thème).
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, "../locales"),
  path.resolve(__dirname, "../src/i18n"),
  path.resolve(__dirname, "../src/domain"),
];

module.exports = config;
