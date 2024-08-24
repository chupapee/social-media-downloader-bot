module.exports = {
	apps: [
		{
			name: 'social-media-downloader-bot',
			script: './dist/main.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1000M',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
};
