module.exports = {
  arrowParens: 'always',
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  plugins: [require.resolve('prettier-plugin-prisma')],
  overrides: [
    {
      files: ['*.prisma'],
      options: {
        parser: 'prisma-parse',
      },
    },
  ],
};
