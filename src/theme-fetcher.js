// theme-fetcher.js
const axios = require('axios');

class ThemeFetcher {
	constructor(config) {
		this.config = config;
		this.currentThemeFiles = [...config.fallbackCssFiles];
		this.lastUpdate = 0;
		this.isFirstRun = true;

		// Check theme on startup
		this.updateTheme();

		// Set automatic checking interval
		if (config.themeUpdateInterval > 0) {
			setInterval(() => {
				this.updateTheme();
			}, config.themeUpdateInterval);
		}
	}

	async updateTheme() {
		try {
			console.log('Checking current theme CSS...');

			const url = `${this.config.baseUrl}${this.config.themePath}`;
			const response = await axios.get(url, {
				timeout: 10000,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				},
			});

			// Search for exact CSS pattern
			const themeRegex = /<link\s+rel="stylesheet"\s+href="(https:\/\/globtechnic\.pl\/themes\/globtechnic\/assets\/cache\/theme-[^"]+\.css)"/gi;
			const matches = [];
			let match;

			while ((match = themeRegex.exec(response.data)) !== null) {
				matches.push(match[1]);
			}

			if (matches.length > 0) {
				// Remove duplicates and get the latest (last one)
				const uniqueMatches = [...new Set(matches)];
				const newThemeFile = uniqueMatches[uniqueMatches.length - 1];

				// Set lastUpdate always on successful fetch
				if (newThemeFile !== this.currentThemeFiles[0] || this.isFirstRun) {
					this.currentThemeFiles = [newThemeFile];
					this.lastUpdate = Date.now();
					this.isFirstRun = false;

					if (newThemeFile !== this.currentThemeFiles[0]) {
						console.log('Found new theme CSS:', newThemeFile);
					} else {
						console.log('Fetched current theme CSS:', newThemeFile);
					}
				} else {
					// Set lastUpdate even when no changes on first check
					if (this.lastUpdate === 0) {
						this.lastUpdate = Date.now();
					}
					console.log('Theme CSS unchanged:', newThemeFile);
				}
			} else {
				console.log('No theme CSS found, using fallback');
				this.currentThemeFiles = [...this.config.fallbackCssFiles];
				// Set lastUpdate for fallback as well
				if (this.lastUpdate === 0) {
					this.lastUpdate = Date.now();
				}
			}
		} catch (error) {
			console.error('Error fetching theme:', error.message);
			console.log('Using fallback CSS');
			this.currentThemeFiles = [...this.config.fallbackCssFiles];
			// Set lastUpdate on error as well
			if (this.lastUpdate === 0) {
				this.lastUpdate = Date.now();
			}
		}
	}

	getThemeFiles() {
		return this.currentThemeFiles;
	}

	async forceUpdate() {
		this.isFirstRun = true; // Force date update
		await this.updateTheme();
		return this.currentThemeFiles;
	}

	getLastUpdateInfo() {
		return {
			files: this.currentThemeFiles,
			lastUpdate: this.lastUpdate,
			lastUpdateDate: this.lastUpdate ? new Date(this.lastUpdate).toLocaleString('pl-PL') : 'Nigdy',
			status: this.lastUpdate ? 'Aktywny' : 'Oczekuje na pierwszą aktualizację',
		};
	}
}

module.exports = ThemeFetcher;
