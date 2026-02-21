const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const ignores = globalIgnores(['build/*']);

module.exports = defineConfig([ignores, expoConfig]);
