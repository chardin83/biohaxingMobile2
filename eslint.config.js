// ESLint v9 flat config (CommonJS)
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const prettierConfig = require('eslint-config-prettier');
const { FlatCompat } = require('@eslint/eslintrc');

// Helper to use legacy shareable configs (like @react-native-community) in flat config
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  js.configs.recommended,
  // React Native community baseline (legacy config bridged via compat)
  ...compat.extends('@react-native-community'),
  // Node context for config/build scripts
  {
    files: ['eslint.config.js', 'metro.config.js', 'scripts/**/*.js'],
    languageOptions: {
      parser: require('espree'),
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      // Define globals available in React Native/JS runtime
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Keep imports at the top and sorted alphabetically
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Modern JSX transform: no need to import React
      'react/react-in-jsx-scope': 'off',
    },
  },
  // Jest/test globals for test files
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '__integration__/**/*.{ts,tsx}',
      'jestSetup.ts',
    ],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        require: 'readonly',
      },
    },
  },
  // Apply Prettier compatibility (turns off rules that conflict with Prettier)
  prettierConfig,
  // Disable eslint-plugin-prettier rule to avoid Prettier v3 API mismatch
  {
    rules: {
      'prettier/prettier': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', 'build/**', 'dist/**'],
  },
];