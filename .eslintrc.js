const { configure, presets } = require('eslint-kit');

module.exports = configure({
	presets: [
		presets.node(),
		presets.prettier({
			trailingComma: 'es5',
			arrowParens: 'always',
			bracketSpacing: true,
			endOfLine: 'lf',
			insertPragma: false,
			proseWrap: 'preserve',
			quoteProps: 'as-needed',
			semi: true,
			semicolons: true,
			singleQuote: true,
			tabWidth: 4,
		}),
		presets.typescript({
			tsconfig: 'tsconfig.json',
		}),
	],
});
