class ThemeController {
	constructor() {
		this.STORAGE_KEY = 'theme-preference';
		this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		this.currentTheme = this.getCurrentTheme();
		this.init();
	}

	init() {
		this.buttons = document.querySelectorAll('[data-theme-toggle-btn]');
		if (this.buttons.length === 0) return;
		this.updateButtonState();
		this.buttons.forEach(button => {
			button.addEventListener('click', () => this.toggle());
		});
		this.mediaQuery.addEventListener('change', e => {
			if (this.getStoredPreference() === 'auto') {
				this.applyTheme(e.matches ? 'dark' : 'light', false);
			}
		});
		window.addEventListener('storage', e => {
			if (e.key === this.STORAGE_KEY) {
				this.syncFromStorage();
			}
		});
	}

	getCurrentTheme() {
		return document.documentElement.getAttribute('data-bs-theme') || 'light';
	}

	getStoredPreference() {
		try {
			return localStorage.getItem(this.STORAGE_KEY) || 'auto';
		} catch (e) {
			return 'auto';
		}
	}

	setStoredPreference(value) {
		try {
			localStorage.setItem(this.STORAGE_KEY, value);
		} catch (e) {
			console.warn('Cannot save theme preference');
		}
	}

	applyTheme(theme, save = true) {
		document.documentElement.setAttribute('data-bs-theme', theme);
		document.body?.setAttribute('data-bs-theme', theme);
		document.documentElement.style.colorScheme = theme;
		if (save) {
			this.setStoredPreference(theme);
		}
		this.currentTheme = theme;
		this.updateButtonState();
		window.dispatchEvent(
			new CustomEvent('theme-changed', {
				detail: {
					theme,
					preference: save ? theme : this.getStoredPreference(),
				},
			}),
		);
	}

	toggle() {
		const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
		this.applyTheme(newTheme);
	}

	updateButtonState() {
		if (!this.buttons || this.buttons.length === 0) return;

		const isDark = this.currentTheme === 'dark';

		this.buttons.forEach(button => {
			button.setAttribute('aria-checked', isDark);
			button.classList.toggle('theme-toggle__button--active', isDark);
		});
	}

	syncFromStorage() {
		const stored = this.getStoredPreference();

		if (stored === 'auto') {
			const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
			this.applyTheme(systemTheme, false);
		} else if (stored === 'dark' || stored === 'light') {
			this.applyTheme(stored, false);
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	window.themeController = new ThemeController();
});

if (typeof module !== 'undefined' && module.exports) {
	module.exports = ThemeController;
}
