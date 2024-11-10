module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  ignores: [
    // # yarn
    'yarn.lock',
    'node_modules',
    // # build/static files
    'static',
    'build',
    // # my
    '_references',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    es6: true,
    browser: true,
    jest: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prefer-const': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
};
