// ESLint checks the code for likely bugs and sloppy patterns.
// "Flat config" format: a list of rule sets, applied in order.
import js from '@eslint/js';
import globals from 'globals';

export default [
  // The recommended rules: unused variables, unreachable code, typos in names...
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node, // knows about process, console, etc.
    },
    rules: {
      // Parameters starting with _ are allowed to be unused on purpose.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'], // === instead of ==
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];