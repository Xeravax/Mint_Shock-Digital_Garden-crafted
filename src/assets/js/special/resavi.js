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
			? this.createLicenseHtml(entry.License.content)
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

	createLicenseHtml(licenseContent) {
		const lowerContent = licenseContent.toLowerCase();
		
		if (lowerContent.includes('paid')) {
			// Extract price from "Paid (...)" patterns and preserve full strings like ranges
			const priceMatch = licenseContent.match(/\(([^)]*)\)/);
			if (priceMatch) {
				let priceStr = priceMatch[1].trim();				priceStr = priceStr.replace(/\s*USD\s*/gi, '');				if (!priceStr.startsWith('$')) {
					priceStr = `$${priceStr}`;
				}
				return `<div class="cardLicense license-paid">${priceStr}</div>`;
			}
			return `<div class="cardLicense license-paid">Paid</div>`;
		}
		
		return `<div class="cardLicense license-free">${licenseContent}</div>`;
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

		this.entries.forEach((entry) => {
			if (entry.category) categories.add(entry.category);
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

		// Free filter checkbox
		const freeFilter = document.getElementById('freeFilter');
		if (freeFilter) {
			freeFilter.addEventListener('change', (e) => this.applyFiltersAndSort());
		}

		// Paid/free filter checkboxes
		const paidFilter = document.getElementById('paidFilter');
		if (paidFilter) {
			paidFilter.addEventListener('change', (e) => this.applyFiltersAndSort());
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
		const freeValue = document.getElementById('freeFilter')?.checked || false;
		const paidValue = document.getElementById('paidFilter')?.checked || false;
		const sortByValue = document.getElementById('sortBy')?.value || 'category';
		const sortOrderValue = document.getElementById('sortOrder')?.value || 'asc';

		// Apply filters
		const filters = {};
		if (searchValue) filters.search = searchValue;
		if (categoryValue) filters.category = categoryValue;
		filters.includeFree = freeValue;
		filters.includePaid = paidValue;

		this.filterCards(filters);

		// Apply sort
		const ascending = sortOrderValue === 'asc';
		this.sortCards(sortByValue, ascending);
	}

	resetAllFilters() {
		document.getElementById('searchInput').value = '';
		document.getElementById('categoryFilter').value = '';
		document.getElementById('freeFilter').checked = true;
		document.getElementById('paidFilter').checked = true;
		document.getElementById('sortBy').value = 'category';
		document.getElementById('sortOrder').value = 'asc';

		this.filteredEntries = [...this.entries];
		this.renderCards();
	}

	// Future expansion methods
	sortCards(sortBy, ascending = true) {
		// Sort by various fields: 'Name', 'Artist', 'category', 'Price', etc.
		this.filteredEntries.sort((a, b) => {
			let aVal = this.getSortValue(a, sortBy);
			let bVal = this.getSortValue(b, sortBy);

			// Special handling for price (numeric sorting)
			if (sortBy === 'Price') {
				const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal) || 0;
				const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal) || 0;
				
				if (ascending) {
					return aNum - bNum; // Ascending: smaller numbers first
				} else {
					return bNum - aNum; // Descending: larger numbers first
				}
			}

			// String comparison for other fields
			if (aVal < bVal) return ascending ? -1 : 1;
			if (aVal > bVal) return ascending ? 1 : -1;
			return 0;
		});
		this.renderCards();
	}

	getSortValue(entry, field) {
		if (field === 'Price') {
			// Special handling for price sorting
			const lowerLicense = entry.License && entry.License.content
				? entry.License.content.toLowerCase()
				: '';
			const isPaid = lowerLicense.includes('paid');

			if (!isPaid) {
				return 0; // Free items cost $0
			}

			// Extract price from paid licenses - handle various formats
			const priceMatch = entry.License.content.match(/\(([^)]*)\)/);
			if (priceMatch) {
				let priceStr = priceMatch[1].trim();
				
				// Extract the first number from the price string
				// Handles formats like: $12$, $15/20USD, $40+, 20 USD, etc.
				const numberMatch = priceStr.match(/(\d+(?:\.\d+)?)/);
				if (numberMatch) {
					return parseFloat(numberMatch[1]);
				}
				
				// Fallback: try to parse the whole string after removing $ and USD
				const cleanPrice = priceStr.replace(/\$/g, '').replace(/USD/i, '').trim();
				const fallbackMatch = cleanPrice.match(/(\d+(?:\.\d+)?)/);
				if (fallbackMatch) {
					return parseFloat(fallbackMatch[1]);
				}
			}
			return 0;
		}

		const value = entry[field];
		if (!value) return '';

		if (typeof value === 'string') return value.toLowerCase();
		if (value.type === 'html') return value.content.toLowerCase();
		if (value.type === 'image') return value.alt.toLowerCase();
		return '';
	}

	filterCards(filters) {
		// Filters object can contain: { category, search, includeFree, price }
		this.filteredEntries = this.entries.filter((entry) => {
			// Category filter
			if (filters.category && entry.category !== filters.category) {
				return false;
			}

			// Free/Paid filter
			const lowerLicense = entry.License && entry.License.content
				? entry.License.content.toLowerCase()
				: '';
			const isPaid = lowerLicense.includes('paid');

			if (isPaid) {
				if (!filters.includePaid) {
					return false;
				}
			} else {
				if (!filters.includeFree) {
					return false;
				}
			}

			// Search filter
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
