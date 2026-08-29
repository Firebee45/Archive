export class FirebeeNav extends HTMLElement {
    connectedCallback() {
        const withSearch = this.hasAttribute('with-search');
        
        const searchHTML = withSearch ? `
            <div class="search-filter-container" id="archiveSearchEngine">
              <div class="active-tags-display"></div>
              <form class="search-box" autocomplete="off">
                <input type="text" class="search-input" placeholder="Search archive..." aria-label="Search content">
                <button type="button" class="filter-btn" title="Filter by tags" aria-label="Filter by tags"></button>
                <button type="button" class="search-btn" aria-label="Toggle search bar"></button>
              </form>
              <div class="filter-panel">
                <div class="filter-panel-header">Show:</div>
                <div class="filter-version-group">
                  <button type="button" class="version-chip" data-version="java">Java</button>
                  <button type="button" class="version-chip" data-version="bedrock">Bedrock</button>
                </div>
                <div class="filter-panel-header">Filter by Tags:</div>
                <div class="filter-tags-grid"></div>
              </div>
            </div>` : '';

        this.innerHTML = `
            <div class="brand"><a class="wordmark" href="/">Fire<em>Bee</em></a></div>
            <nav class="hex-menu" id="hexMenu" aria-label="Site sections">
              <div class="nav-row">
                ${searchHTML}
                <button class="hex-toggle" id="hexToggle" aria-label="Menu">
                  <span class="bars"><span></span><span></span><span></span></span>
                </button>
              </div>
              <div id="petals"></div>
            </nav>
        `;
    }
}

export class FirebeeArchiveShowcase extends HTMLElement {
    connectedCallback() {
        this.className = "Archive-showcase";
    }
}

customElements.define('firebee-nav', FirebeeNav);
customElements.define('firebee-archive-showcase', FirebeeArchiveShowcase);