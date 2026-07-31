import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'out', 'release'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  }
)
