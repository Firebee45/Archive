export class SearchComponent {
  constructor(items, onFilter, containerSelector = '#archiveSearchEngine') {
    this.items = items || [];
    this.onFilter = onFilter;
    this.container = document.querySelector(containerSelector);
    
    if (!this.container) return;
    
    this.searchForm = this.container.querySelector('.search-box');
    this.searchBtn = this.container.querySelector('.search-btn');
    this.searchInput = this.container.querySelector('.search-input');
    this.filterToggleBtn = this.container.querySelector('.filter-btn');
    this.filterPanel = this.container.querySelector('.filter-panel');
    this.filterTagsGrid = this.container.querySelector('.filter-tags-grid');
    this.activeTagsDisplay = this.container.querySelector('.active-tags-display');
    this.versionGroup = this.container.querySelector('.filter-version-group');
    
    this.selectedTags = new Set();
    this.selectedVersions = new Set();
  }

  init() {
    if (!this.container) return;
    this.extractAndRenderTags();
    this.setupVersionToggles();
    this.setupEventListeners();
  }

  setupVersionToggles() {
    if (!this.versionGroup) return;
    const chips = this.versionGroup.querySelectorAll('.version-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        const version = (chip.dataset.version || '').toLowerCase();
        if (this.selectedVersions.has(version)) {
          this.selectedVersions.delete(version);
          chip.classList.remove('selected');
        } else {
          this.selectedVersions.add(version);
          chip.classList.add('selected');
        }
        this.applyFilters();
      });
    });
  }

  extractAndRenderTags() {
    if (!this.filterTagsGrid) return;
    const uniqueTags = new Set();
    
    this.items.forEach(item => {
      if (item && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag && tag.trim()) uniqueTags.add(tag.trim());
        });
      }
    });

    uniqueTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.textContent = tag;
      
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        if (this.selectedTags.has(tag)) {
          this.selectedTags.delete(tag);
          chip.classList.remove('selected');
        } else {
          this.selectedTags.add(tag);
          chip.classList.add('selected');
        }
        this.applyFilters();
      });
      this.filterTagsGrid.appendChild(chip);
    });
  }

  setupEventListeners() {
    if (this.searchBtn && this.searchForm && this.searchInput) {
      this.searchBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.searchForm.classList.contains('active')) {
          this.searchForm.classList.add('active');
          setTimeout(() => this.searchInput.focus(), 50);
        } else {
          this.closeSearchAndFilter();
        }
      });

      this.searchForm.addEventListener('submit', (event) => event.preventDefault());
      this.searchInput.addEventListener('input', () => this.applyFilters());
    }

    if (this.filterToggleBtn && this.filterPanel) {
      this.filterToggleBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.filterPanel.classList.toggle('open');
      });
    }

    document.addEventListener('click', (event) => {
      if (!this.container.contains(event.target)) {
        this.closeSearchAndFilter();
      }
    });
  }

  closeSearchAndFilter() {
    if (this.searchForm) this.searchForm.classList.remove('active');
    if (this.filterPanel) this.filterPanel.classList.remove('open'); 
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.applyFilters();
  }

  updateActiveTagsDisplay() {
    if (!this.activeTagsDisplay) return;
    this.activeTagsDisplay.innerHTML = '';

    this.selectedTags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'active-tag-pill';
      pill.textContent = tag;

      pill.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectedTags.delete(tag);

        if (this.filterTagsGrid) {
          const chips = this.filterTagsGrid.querySelectorAll('.filter-chip');
          chips.forEach(chip => {
            if (chip.textContent === tag) chip.classList.remove('selected');
          });
        }
        this.applyFilters();
      });
      this.activeTagsDisplay.appendChild(pill);
    });
  }

  applyFilters() {
    const textQuery = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
    
    const matchStates = this.items.map(item => {
      if (!item) return false;
      
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const itemTags = Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase().trim()) : [];

      const matchesText = !textQuery || 
          title.includes(textQuery) || 
          description.includes(textQuery) || 
          itemTags.some(t => t.includes(textQuery));

      const matchesTags = this.selectedTags.size === 0 || 
          Array.from(this.selectedTags).every(selectedTag => 
              itemTags.includes(selectedTag.toLowerCase().trim())
          );

      const itemVersion = (item.version || 'java').toLowerCase().trim() === 'bedrock' ? 'bedrock' : 'java';
      const matchesVersion = this.selectedVersions.size === 0 ||
          this.selectedVersions.has(itemVersion);

      return matchesText && matchesTags && matchesVersion;
    });

    if (this.filterToggleBtn) {
      this.filterToggleBtn.classList.toggle('active', this.selectedTags.size > 0 || this.selectedVersions.size > 0);
    }

    this.updateActiveTagsDisplay();
    
    if (typeof this.onFilter === 'function') {
      this.onFilter(matchStates);
    }
  }
}