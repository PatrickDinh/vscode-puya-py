import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/src/test/workspace/**', '**/test/workspace/**']
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        browser: true,
      },
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['**/test/workspace/']
  }
)
