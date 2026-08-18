// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', 'eslint.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // apps/web: React + accessibility linting on top of the shared TS rules.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ignores: ['apps/web/e2e/**', 'apps/web/playwright.config.ts'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  // Playwright e2e specs live outside apps/web's app/node tsconfig project
  // graph (they must stay out of the Vitest/tsc-b build), so they get their
  // own tsconfig for type-aware linting instead of `projectService`'s
  // auto-discovery, which only walks tsconfig.json `references`.
  {
    files: ['apps/web/e2e/**/*.ts', 'apps/web/playwright.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./apps/web/tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettier,
);
