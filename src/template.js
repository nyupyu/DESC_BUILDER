// template.js
const configManager = require('./config-manager');

module.exports = function (content, customCssFiles = [], customJsFiles = [], isProductPage = false, productPath = '') {
	const config = configManager.getConfig();

	const cssFiles = customCssFiles.map(file => `<link rel="stylesheet" href="${file}">`).join('\n      ');
	const jsFiles = customJsFiles.map(file => `<script src="${file}"></script>`).join('\n      ');

	// Fix all relative paths by converting them to absolute URLs
	function fixAllPaths(htmlContent, baseUrl = config.imageUrl || '') {
		let fixedContent = htmlContent;

		// Fix img src attributes for relative paths only
		fixedContent = fixedContent.replace(/<img([^>]*)\ssrc=["']\/([^"']+)["']([^>]*)>/gi, (match, beforeSrc, relativePath, afterSrc) => {
			// Skip if path already contains full domain
			if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.includes('globtechnic.pl')) {
				return match;
			}

			const absolutePath = `${baseUrl}/${relativePath}`;
			console.log(`Fixing image path: /${relativePath} → ${absolutePath}`);
			return `<img${beforeSrc} src="${absolutePath}"${afterSrc}>`;
		});

		// Fix CSS background images in style attributes
		fixedContent = fixedContent.replace(/style=["']([^"']*?)["']/gi, (match, styleContent) => {
			let newStyleContent = styleContent;

			// Handle both background and background-image properties with url()
			newStyleContent = newStyleContent.replace(/background(-image)?:\s*url\(([^)]*)\)/gi, (urlMatch, imageType, urlContent) => {
				// Remove quotes from URL if they exist
				let cleanUrl = urlContent.trim().replace(/^['"]/, '').replace(/['"]$/, '');

				// Check if it's a relative path starting with /
				if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//') && !cleanUrl.includes('globtechnic.pl') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
					const absolutePath = `${baseUrl}${cleanUrl}`;
					console.log(`Fixing CSS background path: ${cleanUrl} → ${absolutePath}`);

					// Return with quotes for safety
					return `background${imageType || ''}: url('${absolutePath}')`;
				}

				return urlMatch;
			});

			return `style="${newStyleContent}"`;
		});

		// Fix background images in pure CSS (for <style> tags)
		fixedContent = fixedContent.replace(/background(-image)?:\s*url\(['"]?\/([^'")\s]+)['"]?\)/gi, (match, imageType, relativePath) => {
			// Skip if path already contains full domain
			if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.includes('globtechnic.pl')) {
				return match;
			}

			const absolutePath = `${baseUrl}/${relativePath}`;
			console.log(`Fixing CSS background path: /${relativePath} → ${absolutePath}`);
			return `background${imageType || ''}: url('${absolutePath}')`;
		});

		// Fix href attributes for document resources
		fixedContent = fixedContent.replace(
			/<a([^>]*)\shref=["']\/([^"']*\.(pdf|doc|docx|xlsx|zip|rar|mp4|mp3))["']([^>]*)>/gi,
			(match, beforeHref, relativePath, extension, afterHref) => {
				// Skip if path already contains full domain
				if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.includes('globtechnic.pl')) {
					return match;
				}

				const absolutePath = `${baseUrl}/${relativePath}`;
				console.log(`Fixing document path: /${relativePath} → ${absolutePath}`);
				return `<a${beforeHref} href="${absolutePath}"${afterHref}>`;
			},
		);

		// Fix video source attributes
		fixedContent = fixedContent.replace(/<video([^>]*)\ssrc=["']\/([^"']+)["']([^>]*)>/gi, (match, beforeSrc, relativePath, afterSrc) => {
			if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.includes('globtechnic.pl')) {
				return match;
			}

			const absolutePath = `${baseUrl}/${relativePath}`;
			console.log(`Fixing video path: /${relativePath} → ${absolutePath}`);
			return `<video${beforeSrc} src="${absolutePath}"${afterSrc}>`;
		});

		// Fix source tags in video/audio elements
		fixedContent = fixedContent.replace(/<source([^>]*)\ssrc=["']\/([^"']+)["']([^>]*)>/gi, (match, beforeSrc, relativePath, afterSrc) => {
			if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.includes('globtechnic.pl')) {
				return match;
			}

			const absolutePath = `${baseUrl}/${relativePath}`;
			console.log(`Fixing source path: /${relativePath} → ${absolutePath}`);
			return `<source${beforeSrc} src="${absolutePath}"${afterSrc}>`;
		});

		return fixedContent;
	}

	// Process content and fix image paths
	const processedContent = fixAllPaths(content);

	// Navigation header for product pages with theme toggle
	const productHeader = isProductPage
		? `
		<nav class="navbar navbar-expand-lg bg-light text-dark border-bottom sticky-top mb-3" style="z-index: 1020; height: 60px;">
			<div class="container-fluid">
				<div class="d-flex align-items-center">
					<a href="/" class="btn btn-outline-primary me-3">
						<i class="fas fa-arrow-left me-2"></i>
						Powrót do przeglądarki
					</a>
					<span class="navbar-text text-muted">
						<i class="fas fa-file-alt me-2"></i>
						<small>${productPath}</small>
					</span>
				</div>
				<div class="d-flex align-items-center">
					<button class="btn btn-outline-secondary me-3" onclick="window.location.reload()">
						<i class="fas fa-sync-alt me-1"></i>
						Odśwież
					</button>
					<small class="text-muted me-3">Live reload: włączony</small>
					
					<!-- Theme toggle in header -->
					<div class="theme-toggle" data-theme-toggle="">
						<button type="button" class="theme-toggle__button btn btn-outline-secondary" role="switch" aria-label="Switch theme" aria-checked="false" data-theme-toggle-btn="">
							<svg class="theme-toggle__icon theme-toggle__icon--light" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
								<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"></circle>
								<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
									<line x1="12" y1="1" x2="12" y2="3"></line>
									<line x1="12" y1="21" x2="12" y2="23"></line>
									<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
									<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
									<line x1="1" y1="12" x2="3" y2="12"></line>
									<line x1="21" y1="12" x2="23" y2="12"></line>
									<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
									<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
								</g>
							</svg>
							<svg class="theme-toggle__icon theme-toggle__icon--dark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
								<path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</nav>
	`
		: '';

	// Theme toggle for main page (only when no product header)
	const mainPageThemeToggle = !isProductPage
		? `
		<header class="position-fixed d-flex justify-content-center m-2" style="right: 0; top: 0; z-index: 9999;">
			<div class="theme-toggle" data-theme-toggle="">
				<button type="button" class="theme-toggle__button" role="switch" aria-label="Switch theme" aria-checked="false" data-theme-toggle-btn="">
					<svg class="theme-toggle__icon theme-toggle__icon--light" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
						<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"></circle>
						<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<line x1="12" y1="1" x2="12" y2="3"></line>
							<line x1="12" y1="21" x2="12" y2="23"></line>
							<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
							<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
							<line x1="1" y1="12" x2="3" y2="12"></line>
							<line x1="21" y1="12" x2="23" y2="12"></line>
							<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
							<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
						</g>
					</svg>
					<svg class="theme-toggle__icon theme-toggle__icon--dark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
					</svg>
				</button>
			</div>
		</header>
	`
		: '';

	return `<!DOCTYPE html>  
  <html lang="pl">  
  <head>  
      <meta charset="UTF-8">  
      <meta name="viewport" content="width=device-width, initial-scale=1.0">  
      <title>${isProductPage ? `Produkt: ${productPath}` : 'Przeglądarka produktów'}</title>
      
      <!-- Preload critical fonts -->
      <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>
      <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2" as="font" type="font/woff2" crossorigin>
      
      <!-- Inline CSS for basic styles -->
      <style>
        /* Apply basic font immediately */
        html {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
        }
        body {
          margin: 0;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          color: #212529;
          background-color: #fff;
          -webkit-text-size-adjust: 100%;
          -webkit-tap-highlight-color: transparent;
        }
        /* Prevent icon flashing */
        .fas, .far, .fab, .fal, .fad, .fa {
          font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", sans-serif;
          font-display: block;
        }
        /* Hide content until CSS loads */
        .folder-browser {
          visibility: hidden;
        }
        .folder-browser.loaded {
          visibility: visible;
        }
        
        /* Top margin for product pages - 58px (60px header - 2px) */
        ${
					isProductPage
						? `
        #wrapper {
          margin-top: 58px;
        }
        `
						: ''
				}
        
        /* Theme toggle button styles */
        .theme-toggle__button {
          border: 1px solid #6c757d;
          background: transparent;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          transition: all 0.15s ease-in-out;
        }
        .theme-toggle__button:hover {
          background-color: #6c757d;
          border-color: #6c757d;
          color: white;
        }
        .theme-toggle__icon {
          display: none;
        }
        [data-bs-theme="light"] .theme-toggle__icon--light {
          display: inline;
        }
        [data-bs-theme="dark"] .theme-toggle__icon--dark {
          display: inline;
        }
        
        /* Image styles - better loading */
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Placeholder for images during loading */
        img:not([src]) {
          background-color: #f8f9fa;
          border: 1px dashed #dee2e6;
          display: inline-block;
          min-width: 50px;
          min-height: 50px;
        }
        
        /* Hide empty src images */
        img[src=""] {
          display: none;
        }
      </style>
      
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${cssFiles}
      
      <script title="theme-switch">
        (function() {
          'use strict';
          // Storage utilities
          const storage = {
            get: (key) => {
              try {
                return localStorage.getItem(key);
              } catch (e) {
                return null;
              }
            },
            set: (key, value) => {
              try {
                localStorage.setItem(key, value);
                return true;
              } catch (e) {
                return false;
              }
            }
          };
          // Initialize theme immediately (before DOM is ready)
          const savedTheme = storage.get('theme-preference') || 'auto';
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          let theme = 'light';
          if (savedTheme === 'dark') {
            theme = 'dark';
          } else if (savedTheme === 'auto' && systemPrefersDark) {
            theme = 'dark';
          }
          document.documentElement.setAttribute('data-bs-theme', theme);
          document.documentElement.style.colorScheme = theme;

          if (!savedTheme) {
            storage.set('theme-preference', 'auto');
          }
          // Initialize buttons when DOM is ready
          function initButtons() {
            const buttons = document.querySelectorAll('[data-theme-toggle-btn]');
            if (buttons.length > 0) {
              const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
              buttons.forEach(btn => {
                btn.setAttribute('aria-checked', isDark);
              });
            }
          }
          
          // Show content after loading
          function showContent() {
            const browsers = document.querySelectorAll('.folder-browser');
            browsers.forEach(browser => browser.classList.add('loaded'));
          }
          
          // Handle image loading errors
          function handleImageErrors() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              img.addEventListener('error', function() {
                console.warn('Nie udało się załadować obrazu:', this.src);
                // Optional placeholder can be added here
                // this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f8f9fa"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236c757d">Brak obrazu</text></svg>';
              });
            });
          }
          
          // Run immediately if DOM is already ready, otherwise wait
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              initButtons();
              handleImageErrors();
              // Small delay to ensure CSS is loaded
              setTimeout(showContent, 50);
            });
          } else {
            initButtons();
            handleImageErrors();
            setTimeout(showContent, 50);
          }
        })();
      </script>
      
      <script src="/socket.io/socket.io.js"></script>  
      <script>  
        // Code for automatic refresh  
        const socket = io();  
        socket.on('fileChanged', () => {  
          console.log('Wykryto zmianę pliku, odświeżanie...');  
          window.location.reload();  
        });  
      </script>  
  </head>  
  <body><main> 
      ${productHeader}
      ${mainPageThemeToggle}
      
      <section id="wrapper">
        <div id="inner-wrapper">
          <div id="content-wrapper">
            <section id="main">
              <div id="main-product-wrapper">
                  <div id="rte-content">
                    ${processedContent}
                  </div>
                </div>
            </section>
          </div>
        </div>
      </section>
      </main>
      <script type="module" src="/theme-manager.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>  
      </body>  
  </html>`;
};
