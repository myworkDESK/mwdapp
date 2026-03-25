export default [
  {
    files: ['src/**/*.js', 'lib/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        TextEncoder: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-duplicate-imports': 'error',
    },
  },
];
