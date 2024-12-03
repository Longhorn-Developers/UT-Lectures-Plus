import js from '@eslint/js';
import solid from 'eslint-plugin-solid';
import globals from 'globals';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  // Core ESLint configuration
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      }],
      '@typescript-eslint/explicit-member-accessibility': ['error', {
        accessibility: 'explicit',
      }],
    },
  },
  // SolidJS configuration
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      solid,
    },
    rules: {
      ...solid.configs.recommended.rules,
      'solid/reactivity': 'error',
      'solid/no-destructure': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/prefer-for': 'error',
    },
  },
  // JSDoc configuration
  {
    plugins: {
      jsdoc,
    },
    rules: {
      ...jsdoc.configs['recommended'].rules,
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
      }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/valid-types': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
      'jsdoc/no-bad-blocks': 'error',
    },
  },
  // General styling rules
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript
      'prefer-const': 'error',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
    },
  },
//   // Override for test files
//   {
//     files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
//     rules: {
//       '@typescript-eslint/no-explicit-any': 'off',
//       'jsdoc/require-jsdoc': 'off',
//     },
//   },
  // Files to ignore
  {
    ignores: [
      'dist/**',
      'build/**',
      '.output/**',
      'coverage/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
];
