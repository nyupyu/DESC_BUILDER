// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const template = require('./src/template');
const ThemeFetcher = require('./src/theme-fetcher');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize theme fetcher
const themeFetcher = new ThemeFetcher(config);

// Serve static files
app.use(express.static('public'));

// API endpoint for manual theme update
app.get('/api/update-theme', async (req, res) => {
	try {
		const newThemes = await themeFetcher.forceUpdate();
		const info = themeFetcher.getLastUpdateInfo();
		res.json({
			success: true,
			message: 'Theme zaktualizowany',
			...info,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

// API endpoint for theme status check
app.get('/api/theme-status', (req, res) => {
	const info = themeFetcher.getLastUpdateInfo();
	res.json(info);
});

// Get current CSS files from theme fetcher
function getCurrentCssFiles() {
	return themeFetcher.getThemeFiles();
}

// Scan directory structure for pages
function scanPagesDirectory(dirPath = './pages', relativePath = '') {
	const items = [];

	try {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
			return items;
		}

		const entries = fs.readdirSync(dirPath);

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry);
			const stats = fs.statSync(fullPath);

			if (stats.isDirectory()) {
				const subItems = scanPagesDirectory(fullPath, path.join(relativePath, entry));
				items.push({
					name: entry,
					type: 'folder',
					path: path.join(relativePath, entry),
					children: subItems,
				});
			} else if (stats.isFile() && entry.endsWith('.html')) {
				const name = entry.replace('.html', '');
				items.push({
					name: name,
					type: 'file',
					path: path.join(relativePath, name).replace(/\\/g, '/'),
					fullPath: relativePath ? `${relativePath.replace(/\\/g, '/')}/${name}` : name,
				});
			}
		}
	} catch (error) {
		console.error(`Error scanning directory ${dirPath}:`, error);
	}

	// Sort items: folders first, then files, alphabetically
	return items.sort((a, b) => {
		if (a.type !== b.type) {
			return a.type === 'folder' ? -1 : 1;
		}
		return a.name.localeCompare(b.name);
	});
}

// Generate HTML for folder browser interface
function generateFolderBrowser(items, currentPath = '') {
	let html = '<div class="folder-browser">';

	if (currentPath) {
		html += `
			<div class="breadcrumb-container mb-3">
				<nav aria-label="breadcrumb">
					<ol class="breadcrumb">
						<li class="breadcrumb-item"><a href="/">🏠 Główna</a></li>
		`;

		const pathParts = currentPath.split('/');
		let buildPath = '';
		for (let i = 0; i < pathParts.length; i++) {
			buildPath += (i > 0 ? '/' : '') + pathParts[i];
			if (i === pathParts.length - 1) {
				html += `<li class="breadcrumb-item active" aria-current="page">${pathParts[i]}</li>`;
			} else {
				html += `<li class="breadcrumb-item"><a href="/?path=${encodeURIComponent(buildPath)}">${pathParts[i]}</a></li>`;
			}
		}

		html += `
					</ol>
				</nav>
			</div>
		`;
	}

	if (items.length === 0) {
		html += '<div class="alert alert-info">Brak plików w tym katalogu</div>';
	} else {
		html += '<div class="list-group">';

		for (const item of items) {
			if (item.type === 'folder') {
				const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
				html += `
					<a href="/?path=${encodeURIComponent(newPath)}" class="list-group-item list-group-item-action d-flex align-items-center">
						<i class="fas fa-folder text-warning me-3"></i>
						<span>${item.name}/</span>
						<small class="text-muted ms-auto">${item.children.length} elementów</small>
					</a>
				`;
			} else {
				const productPath = currentPath ? `${currentPath}/${item.name}` : item.name;
				html += `
					<a href="/product/${productPath}" class="list-group-item list-group-item-action d-flex align-items-center">
						<i class="fas fa-file-alt text-primary me-3"></i>
						<span>${item.name}</span>
						<small class="text-muted ms-auto">Opis produktu</small>
					</a>
				`;
			}
		}

		html += '</div>';
	}

	html += '</div>';
	return html;
}

// Main page handler - folder browser
app.get('/', (req, res) => {
	try {
		const requestedPath = req.query.path || '';
		const fullPath = requestedPath ? path.join('./pages', requestedPath) : './pages';

		// Security check - prevent directory traversal outside pages folder
		const resolvedPath = path.resolve(fullPath);
		const pagesPath = path.resolve('./pages');

		if (!resolvedPath.startsWith(pagesPath)) {
			return res.status(403).send('Dostęp zabroniony');
		}

		if (!fs.existsSync(resolvedPath)) {
			return res.status(404).send('Katalog nie istnieje');
		}

		const items = scanPagesDirectory(resolvedPath, requestedPath);
		const browserHtml = generateFolderBrowser(items, requestedPath);

		// Add theme information panel
		const themeInfo = themeFetcher.getLastUpdateInfo();
		const themePanel = `
			<div class="card mt-4">
				<div class="card-header">
					<h5 class="mb-0">
						<i class="fas fa-palette me-2"></i>
						Status motywu CSS
					</h5>
				</div>
				<div class="card-body">
					<div class="row">
						<div class="col-md-8">
							<p><strong>Aktualny CSS:</strong></p>
							<ul class="list-unstyled">
								${themeInfo.files.map(file => `<li><code>${file}</code></li>`).join('')}
							</ul>
						</div>
						<div class="col-md-4 text-end">
							<p><strong>Ostatnia aktualizacja:</strong><br>
							<small class="text-muted">${themeInfo.lastUpdateDate}</small></p>
							<button onclick="updateTheme()" class="btn btn-outline-primary btn-sm">
								<i class="fas fa-sync me-1"></i>Wymuś aktualizację
							</button>
						</div>
					</div>
				</div>
			</div>
			
			<script>
			async function updateTheme() {
				try {
					const response = await fetch('/api/update-theme');
					const result = await response.json();
					if (result.success) {
						alert('Theme zaktualizowany! Odświeżanie strony...');
						window.location.reload();
					} else {
						alert('Błąd aktualizacji: ' + result.message);
					}
				} catch (error) {
					alert('Błąd połączenia: ' + error.message);
				}
			}
			</script>
		`;

		const pageContent = `
			<div class="container-fluid py-4">
				<div class="row justify-content-center">
					<div class="col-lg-10 col-xl-8">
						<div class="card shadow-sm">
							<div class="card-header bg-primary text-white">
								<h1 class="card-title mb-0">
									<i class="fas fa-box-open me-2"></i>
									Przeglądarka opisów produktów
								</h1>
							</div>
							<div class="card-body">
								<div class="row mb-3">
									<div class="col">
										<p class="text-muted mb-0">
											Wybierz folder lub plik HTML z opisem produktu. Pliki otworzą się w nowej karcie.
										</p>
									</div>
								</div>
								${browserHtml}
							</div>
						</div>
						
						${themePanel}
						
						<div class="card mt-4">
							<div class="card-header">
								<h5 class="mb-0">
									<i class="fas fa-info-circle me-2"></i>
									Instrukcja użytkowania
								</h5>
							</div>
							<div class="card-body">
								<div class="row">
									<div class="col-md-6">
										<h6>📁 Struktura katalogów:</h6>
										<ul class="list-unstyled">
											<li>• Kliknij folder aby go otworzyć</li>
											<li>• Użyj breadcrumb do nawigacji</li>
											<li>• Kliknij "🏠 Główna" aby wrócić</li>
											<li>• Obsługa dowolnego poziomu zagnieżdżenia</li>
										</ul>
									</div>
									<div class="col-md-6">
										<h6>📄 Pliki produktów:</h6>
										<ul class="list-unstyled">
											<li>• Pliki .html otwierają się w nowej karcie</li>
											<li>• Automatyczne odświeżanie przy zmianach</li>
											<li>• Header z przyciskiem powrotu</li>
											<li>• Automatyczny motyw z globtechnic.pl</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		// Use current CSS files from theme fetcher
		const fullHtml = template(pageContent, getCurrentCssFiles(), [], false);
		res.send(fullHtml);
	} catch (error) {
		console.error('Error browsing folders:', error);
		res.status(500).send(`Server error: ${error.message}`);
	}
});

// Product handler with nested folder support
app.get('/product/*', (req, res) => {
	try {
		// Get full path after /product/
		const productPath = req.params[0];
		const filePath = path.join(__dirname, 'pages', productPath + '.html');

		// Security path validation
		const resolvedFilePath = path.resolve(filePath);
		const pagesPath = path.resolve(path.join(__dirname, 'pages'));

		if (!resolvedFilePath.startsWith(pagesPath)) {
			return res.status(403).send('Dostęp zabroniony');
		}

		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf8');
			// Use current CSS files from theme fetcher
			const fullHtml = template(content, getCurrentCssFiles(), config.customJsFiles, true, productPath);
			res.send(fullHtml);
		} else {
			const errorContent = `
				<div class="container py-5">
					<div class="row justify-content-center">
						<div class="col-md-8">
							<div class="alert alert-danger">
								<h4><i class="fas fa-exclamation-triangle me-2"></i>Nie znaleziono strony produktu</h4>
								<p>Plik <code>${productPath}.html</code> nie istnieje.</p>
								<hr>
								<a href="/" class="btn btn-primary">
									<i class="fas fa-home me-2"></i>Powrót do przeglądarki
								</a>
							</div>
						</div>
					</div>
				</div>
			`;
			// Use current CSS files from theme fetcher
			const fullHtml = template(errorContent, getCurrentCssFiles(), [], true, productPath);
			res.status(404).send(fullHtml);
		}
	} catch (error) {
		console.error('Error loading product:', error);
		res.status(500).send(`Error: ${error.message}`);
	}
});

// Legacy handler for backward compatibility
app.get('/:category/:product', (req, res) => {
	const { category, product } = req.params;
	const filePath = path.join(__dirname, 'pages', category, `${product}.html`);
	const productPath = `${category}/${product}`;

	try {
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf8');
			// Use current CSS files from theme fetcher
			const fullHtml = template(content, getCurrentCssFiles(), config.customJsFiles, true, productPath);
			res.send(fullHtml);
		} else {
			// Redirect to new handler if not found
			const newPath = `/product/${category}/${product}`;
			res.redirect(newPath);
		}
	} catch (error) {
		res.status(500).send(`Error: ${error.message}`);
	}
});

// Socket.IO handling for live reloading
io.on('connection', socket => {
	console.log('Client connected');
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// File watcher for all HTML files in pages directory
const watcher = chokidar.watch('./pages/**/*.html', {
	persistent: true,
});

watcher.on('change', path => {
	console.log(`File ${path} was changed`);
	io.emit('fileChanged');
});

server.listen(config.port, () => {
	console.log(`Server started on http://localhost:${config.port}`);
	console.log(`Product browser available on main page`);
	console.log(`Auto theme fetching from ${config.baseUrl}${config.themePath}`);
	console.log(`API: /api/update-theme (force), /api/theme-status (status)`);
	console.log(`Place your HTML files in the "pages/" directory`);
});
