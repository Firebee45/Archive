class FirebeeNav extends HTMLElement {
    connectedCallback() {
        const actionHTML = this.hasAttribute('with-action')
            ? '<button id="navCta" class="site-nav-action" type="button">Choose world</button>'
            : '';
        const searchHTML = this.hasAttribute('with-search') ? `
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
        const brandHTML = this.hasAttribute('custom-brand')
            ? '<a class="wordmark" href="/" id="brandWordmark"></a>'
            : '<a class="wordmark" href="/">Fire<em>Bee</em></a>';

        this.innerHTML = `
            <div class="brand">${brandHTML}</div>
            <nav class="hex-menu" id="hexMenu" aria-label="Site sections">
              <div class="nav-row">
                ${searchHTML}
                ${actionHTML}
                <button class="hex-toggle" id="hexToggle" aria-label="Menu">
                  <span class="bars"><span></span><span></span><span></span></span>
                </button>
              </div>
              <div id="petals"></div>
            </nav>
        `;
    }
}

customElements.define('firebee-nav', FirebeeNav);
