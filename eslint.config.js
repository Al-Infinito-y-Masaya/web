import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'dist',
			'coverage',
			'src/app/routeTree.gen.ts',
			'src/shared/client/api-types.d.ts',
			'templates'
		]
	},
	{
		files: ['**/*.{ts,tsx}'],
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2023,
			globals: globals.browser
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ fixStyle: 'inline-type-imports' }
			]
		}
	},
	{
		// Route files export `Route` alongside components; shadcn primitives export variants.
		files: [
			'src/app/routes/**/*.tsx',
			'src/shared/ui/**/*.tsx',
			'src/features/**/*.tsx',
			'src/test/**/*.tsx'
		],
		rules: { 'react-refresh/only-export-components': 'off' }
	},
	{
		files: ['scripts/**/*.{js,mjs}', '*.config.{js,ts}'],
		extends: [js.configs.recommended],
		languageOptions: { globals: globals.node }
	}
);
