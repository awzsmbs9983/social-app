module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:react-native-a11y/ios'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'detox'],
  ignorePatterns: [
    '**/__mocks__/*.ts',
    'src/third-party',
    'ios',
    'android',
    'coverage',
  ],
  overrides: [
    {
      files: ['*.js', '*.mjs', '*.ts', '*.tsx'],
      rules: {
        semi: [2, 'never'],
      },
    },
  ],
}
