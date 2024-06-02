// @ts-check

import eslint from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import commentsPlugin from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import-x';
import jestPlugin from 'eslint-plugin-jest';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
// eslint-disable-next-line import-x/no-unresolved
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    ignores: [
      'dist',
      'build',
      'src/infra/prisma/generated/*',
      '.yarn',
      '.pnp.*',
    ],
  },
  eslint.configs.recommended,
  {
    rules: {
      curly: ['error', 'all'],
      'no-console': 'error',
      'no-fallthrough': [
        'error',
        { commentPattern: '.*intentional fallthrough.*' },
      ],
    },
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // enable jest rules on test files
    files: ['**/tests.util.*', '**/*.spec.*', '**/*.e2e-spec.*'],
    ...jestPlugin.configs['flat/recommended'],
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'pactum.**.expect*'],
        },
      ],
    },
  },
  {
    plugins: {
      '@stylistic': stylisticPlugin,
    },
    rules: {
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    plugins: {
      'eslint-comments': commentsPlugin,
    },
    rules: {
      // Require a eslint-enable comment for every eslint-disable comment
      'eslint-comments/disable-enable-pair': [
        'error',
        {
          allowWholeFile: true,
        },
      ],
      // Disallow a eslint-enable comment for multiple eslint-disable comments
      'eslint-comments/no-aggregating-enable': 'error',
      // Disallow duplicate eslint-disable comments
      'eslint-comments/no-duplicate-disable': 'error',
      // Disallow eslint-disable comments without rule names
      'eslint-comments/no-unlimited-disable': 'error',
      // Disallow unused eslint-disable comments
      'eslint-comments/no-unused-disable': 'error',
      // Disallow unused eslint-enable comments
      'eslint-comments/no-unused-enable': 'error',
      // Disallow ESLint directive-comments
      'eslint-comments/no-use': [
        'error',
        {
          allow: [
            'eslint-disable',
            'eslint-disable-line',
            'eslint-disable-next-line',
            'eslint-enable',
          ],
        },
      ],
    },
  },
  {
    plugins: {
      'import-x': importPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      // Disallow non-import statements appearing before import statements
      'import-x/first': 'error',
      // Require a newline after the last import/require in a group
      'import-x/newline-after-import': 'error',
      // Forbid import of modules using absolute paths
      'import-x/no-absolute-path': 'error',
      // Disallow AMD require/define
      'import-x/no-amd': 'error',
      // Ensures an imported module can be resolved to a module on the local filesystem
      'import-x/no-unresolved': ['error', { ignore: ['generated', 'express'] }],
      // Forbid the use of extraneous packages
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          peerDependencies: true,
          optionalDependencies: false,
        },
      ],
      // Forbid mutable exports
      'import-x/no-mutable-exports': 'error',
      // Forbid a module from importing itself
      'import-x/no-self-import': 'error',
    },
    settings: {
      ...importPlugin.configs.typescript.settings,
      'import-x/ignore': [
        'axios',
        'class-transformer',
        'class-validator',
        'lib0/decoding',
        'lib0/encoding',
        'y-protocols/awareness',
        'y-protocols/sync',
      ],
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Dependency packages come first.
            ['^@?\\w'],
            // Side effect imports.
            ['^\\u0000'],
            // Parent imports. Put `..` last.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports. Put same-folder imports and `.` last.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          ],
        },
      ],
    },
  },
  prettierConfig,
);
