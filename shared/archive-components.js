export class FirebeeArchiveShowcase extends HTMLElement {
    connectedCallback() {
        this.className = 'Archive-showcase';
    }
}

customElements.define('firebee-archive-showcase', FirebeeArchiveShowcase);
