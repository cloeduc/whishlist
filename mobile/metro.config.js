// Metro lit aussi des fichiers du site, sources uniques : textes (../locales), configuration i18n
// (../src/i18n, R8), règles pures partagées avec l'app (../src/domain : format des identifiants, thème)
// et constantes du site (../src/site/contact.ts).
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
