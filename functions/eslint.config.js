import js from '@eslint/js';
import promisePlugin from 'eslint-plugin-promise';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      promise: promisePlugin
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-unused-vars': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
      'consistent-return': 'warn',
      'array-callback-return': 'warn',
      'no-eval': 'error',
      'no-implicit-coercion': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-await-in-loop': 'warn',
      'require-atomic-updates': 'error'
    }
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    }
  }
];