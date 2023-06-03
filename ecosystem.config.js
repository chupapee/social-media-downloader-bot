module.exports = {
	apps: [
		{
			name: 'social-media-bot',
			script: './dist/index.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '500M',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
};
