const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.cacheVersion = "owed";

// Marketing site lives in-repo but must not trigger Expo/Metro reloads.
const websiteDir = path.resolve(__dirname, "website").replace(/[/\\]/g, "[/\\\\]");
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  new RegExp(`^${websiteDir}[/\\\\].*`),
];

module.exports = config;
