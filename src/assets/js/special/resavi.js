/**
 * ResAvi Avatar Bases Display
 * Fetches data from Resonite Wiki and displays avatar bases as cards
 */

class ResAviManager {
	constructor() {
		this.entries = [];
		this.filteredEntries = [];
		this.container = null;
		this.cardTemplate = null;
	}

	async loadTemplate() {
		const response = await fetch('/assets/templates/card.tmpl');
		if (!response.ok) {
			throw new Error(`Failed to load card template: ${response.status}`);
		}
		this.cardTemplate = await response.text();
	}

	async init() {
		this.container = document.getElementById('cards');
		if (!this.container) {
			console.error('Cards container not found');
			return;
		}

		try {
			await this.loadTemplate();
			await this.loadWikiData();
			this.setupFilterOptions();
			this.setupEventListeners();
			this.applyFiltersAndSort();
		} catch (error) {
			console.error('Failed to initialize:', error);
			this.showError('Failed to load avatar bases data');
		}
	}

	async loadWikiData() {
		const page = 'Resonite ready avatar bases';
		const url = `https://wiki.resonite.com/api.php?action=parse&page=${page}&prop=text&format=json&origin=*`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const html = data.parse.text['*'];
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		const tables = doc.querySelectorAll('table.avatarTable.wikitable');

		tables.forEach((table) => {
			let category = this.extractCategory(table);

			const headers = this.extractHeaders(table);
			const rows = table.querySelectorAll('tr');

			rows.forEach((row) => {
				const entry = this.parseRow(row, headers);
				if (entry) {
					entry.category = category;
					this.entries.push(entry);
				}
			});
		});

		this.filteredEntries = [...this.entries];
	}

	extractCategory(table) {
		let category = 'unknown';
		let current = table.previousElementSibling;

		while (current) {
			if (current.classList && current.classList.contains('mw-heading')) {
				const h = current.querySelector('h3, h4');
				if (h && h.id) {
					category = h.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
				}
				break;
			}
			current = current.previousElementSibling;
		}

		return category;
	}

	extractHeaders(table) {
		return [...table.querySelectorAll('th')].map((th) =>
			th.textContent.trim(),
		);
	}

	parseRow(row, headers) {
		const cells = [...row.querySelectorAll('td')].map((td) =>
			this.parseCell(td),
		);

		if (cells.length === 0) return null;

		const entry = {};
		headers.forEach((header, i) => {
			entry[header] = cells[i];
		});

		return entry;
	}

	parseCell(td) {
		const img = td.querySelector('img');
		if (img) {
			return {
				type: 'image',
				src: img.src,
				srcset: img.srcset.split(',').map((s) => s.trim()),
				alt: img.alt,
			};
		}

		// Process links
		const links = td.querySelectorAll('a');
		links.forEach((a) => {
			if (a.getAttribute('href').startsWith('/')) {
				a.setAttribute(
					'href',
					'https://wiki.resonite.com' + a.getAttribute('href'),
				);
			}
		});

		return {
			type: 'html',
			content: td.innerHTML.trim(),
		};
	}

	renderCards() {
		this.container.innerHTML = ''; // Clear existing cards

		this.filteredEntries.forEach((entry) => {
			const card = this.createCard(entry);
			this.container.appendChild(card);
		});
	}

	createCard(entry) {
		let html = this.cardTemplate;

		// Replace placeholders
		const categoryClass = entry.category ? `card-${entry.category}` : '';
		html = html.replace('{{categoryClass}}', categoryClass);

		const bgImageStyle = entry.Image && entry.Image.type === 'image'
			? ` style="--bg-image: url('${entry.Image.srcset[entry.Image.srcset.length - 1].split(' ')[0]}')"`
			: '';
		html = html.replace('{{bgImageStyle}}', bgImageStyle);

		html = html.replace('{{category}}', entry.category || '');

		const licenseHtml = entry.License && entry.License.content
			? `<div class="cardLicense">${entry.License.content}</div>`
			: '';
		html = html.replace('{{licenseHtml}}', licenseHtml);

		const imageHtml = this.createImageHtml(entry.Image);
		html = html.replace('{{imageHtml}}', imageHtml);

		const name = (entry.Name && entry.Name.content) || 'Unknown';
		html = html.replace('{{name}}', name);

		const artist = (entry.Artist && entry.Artist.content) || '-';
		html = html.replace('{{artist}}', artist);

		// Create card element from HTML
		const card = document.createElement('div');
		card.innerHTML = html;

		// Set up image onload handler
		const img = card.querySelector('.cardImage');
		if (img) {
			img.onload = () => this.checkAspectRatio(img);
		}

		return card.firstElementChild; // Return the card div, not the wrapper
	}

	createImageHtml(imageData) {
		if (imageData && imageData.type === 'image') {
			const largestSrc = imageData.srcset[imageData.srcset.length - 1].split(' ')[0];
			return `<img class="cardImage" src="${largestSrc}"
				srcset="${imageData.srcset.join(', ')}"
				alt="${imageData.alt || ''}">`;
		} else {
			return `<img class="cardImage squareImage" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
				alt="No Image Available">`;
		}
	}

	checkAspectRatio(img) {
		const ratio = img.naturalWidth / img.naturalHeight;
		if (Math.abs(ratio - 1) < 0.2) {
			img.classList.add('squareImage');
		}
	}

	showError(message) {
		this.container.innerHTML = `<div class="error">${message}</div>`;
	}

	setupFilterOptions() {
		// Collect unique categories
		const categories = new Set();
		const licenses = new Set();

		this.entries.forEach((entry) => {
			if (entry.category) categories.add(entry.category);
			if (entry.License && entry.License.content) {
				licenses.add(entry.License.content);
			}
		});

		// Populate category filter
		const categorySelect = document.getElementById('categoryFilter');
		if (categorySelect) {
			[...categories].sort().forEach((cat) => {
				const option = document.createElement('option');
				option.value = cat;
				option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
				categorySelect.appendChild(option);
			});
		}

		// Populate license filter
		const licenseSelect = document.getElementById('licenseFilter');
		if (licenseSelect) {
			[...licenses].sort().forEach((license) => {
				const option = document.createElement('option');
				option.value = license;
				option.textContent = license;
				licenseSelect.appendChild(option);
			});
		}
	}

	setupEventListeners() {
		// Search input
		const searchInput = document.getElementById('searchInput');
		if (searchInput) {
			searchInput.addEventListener('input', (e) => this.applyFiltersAndSort());
		}

		// Category filter
		const categoryFilter = document.getElementById('categoryFilter');
		if (categoryFilter) {
			categoryFilter.addEventListener('change', (e) => this.applyFiltersAndSort());
		}

		// License filter
		const licenseFilter = document.getElementById('licenseFilter');
		if (licenseFilter) {
			licenseFilter.addEventListener('change', (e) => this.applyFiltersAndSort());
		}

		// Sort by
		const sortBy = document.getElementById('sortBy');
		if (sortBy) {
			sortBy.addEventListener('change', (e) => this.applyFiltersAndSort());
		}

		// Sort order
		const sortOrder = document.getElementById('sortOrder');
		if (sortOrder) {
			sortOrder.addEventListener('change', (e) => this.applyFiltersAndSort());
		}

		// Reset filters button
		const resetBtn = document.getElementById('resetFilters');
		if (resetBtn) {
			resetBtn.addEventListener('click', () => this.resetAllFilters());
		}
	}

	applyFiltersAndSort() {
		const searchValue = document.getElementById('searchInput')?.value || '';
		const categoryValue = document.getElementById('categoryFilter')?.value || '';
		const licenseValue = document.getElementById('licenseFilter')?.value || '';
		const sortByValue = document.getElementById('sortBy')?.value || 'category';
		const sortOrderValue = document.getElementById('sortOrder')?.value || 'asc';

		// Apply filters
		const filters = {};
		if (searchValue) filters.search = searchValue;
		if (categoryValue) filters.category = categoryValue;
		if (licenseValue) filters.license = licenseValue;

		this.filterCards(filters);

		// Apply sort
		const ascending = sortOrderValue === 'asc';
		this.sortCards(sortByValue, ascending);
	}

	resetAllFilters() {
		document.getElementById('searchInput').value = '';
		document.getElementById('categoryFilter').value = '';
		document.getElementById('licenseFilter').value = '';
		document.getElementById('sortBy').value = 'category';
		document.getElementById('sortOrder').value = 'asc';

		this.filteredEntries = [...this.entries];
		this.renderCards();
	}

	// Future expansion methods
	sortCards(sortBy, ascending = true) {
		// Sort by various fields: 'Name', 'Artist', 'category', etc.
		this.filteredEntries.sort((a, b) => {
			let aVal = this.getSortValue(a, sortBy);
			let bVal = this.getSortValue(b, sortBy);

			if (aVal < bVal) return ascending ? -1 : 1;
			if (aVal > bVal) return ascending ? 1 : -1;
			return 0;
		});
		this.renderCards();
	}

	getSortValue(entry, field) {
		const value = entry[field];
		if (!value) return '';

		if (typeof value === 'string') return value.toLowerCase();
		if (value.type === 'html') return value.content.toLowerCase();
		if (value.type === 'image') return value.alt.toLowerCase();
		return '';
	}

	filterCards(filters) {
		// Filters object can contain: { category: 'string', license: 'string', search: 'string' }
		this.filteredEntries = this.entries.filter((entry) => {
			if (filters.category && entry.category !== filters.category) {
				return false;
			}
			if (
				filters.license &&
				this.getSortValue(entry, 'License') !==
					filters.license.toLowerCase()
			) {
				return false;
			}
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				const name = this.getSortValue(entry, 'Name');
				const artist = this.getSortValue(entry, 'Artist');
				if (!name.includes(searchTerm) && !artist.includes(searchTerm)) {
					return false;
				}
			}
			return true;
		});
		this.renderCards();
	}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const manager = new ResAviManager();
	window.resAviManager = manager; // Expose for debugging/console access
	manager.init();
});
