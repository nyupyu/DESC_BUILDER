const fs = require('fs');
const path = require('path');

class ConfigManager {
	constructor() {
		this.configPath = path.resolve(__dirname, '../config.js');
		this.config = null;
		this.loadConfig();
		this.watchConfig();
	}

	loadConfig() {
		try {
			delete require.cache[this.configPath];
			this.config = require('../config.js');
			console.log('Config loaded/reloaded from:', this.configPath);
		} catch (error) {
			console.error('There is something wrong with:', error.message);
			console.error('Were looking in:', this.configPath);
			this.config = {}; // fallback
		}
	}

	watchConfig() {
		fs.watchFile(this.configPath, () => {
			console.log('Config file changed, reloading...');
			this.loadConfig();
		});
	}

	getConfig() {
		return this.config;
	}
}

module.exports = new ConfigManager();
