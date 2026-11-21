const sections = [
    { label: 'Home', href: '/' },
    { label: 'Archive', href: '/Archive/' },
    { label: 'Projects', href: '/Projects/' },
    { label: 'Tools', href: '/Tools/' }
];

function isActive(href, path) {
    if (href === '/') return path === '/' || path.endsWith('/index.html');
    return path.toLowerCase().startsWith(href.toLowerCase());
}

export class NavComponent {
    constructor(navSections = sections, selector = '#petals') {
        this.sections = navSections;
        this.container = document.querySelector(selector);
        this.menu = document.getElementById('hexMenu');
        this.toggle = document.getElementById('hexToggle');
    }

    init() {
        if (!this.container || !this.menu || !this.toggle) return;
        this.render();
        this.setupEventListeners();
    }

    render() {
        const path = window.location.pathname;
        this.sections.forEach(page => {
            const link = document.createElement('a');
            link.href = page.href;
            link.className = 'petal';
            if (page.active === undefined ? isActive(page.href, path) : page.active) {
                link.classList.add('active');
            }
            link.textContent = page.label;
            this.container.appendChild(link);
            link.addEventListener('click', () => this.setActive(link));
        });
    }

    setupEventListeners() {
        this.toggle.addEventListener('click', event => {
            event.stopPropagation();
            this.menu.classList.toggle('open');
        });

        document.addEventListener('click', event => {
            if (!this.menu.contains(event.target)) {
                this.menu.classList.remove('open');
            }
        });
    }

    setActive(linkElement) {
        document.querySelectorAll('.petal').forEach(item => item.classList.remove('active'));
        linkElement.classList.add('active');
        this.menu.classList.remove('open');
    }
}

export function initSiteNav() {
    new NavComponent().init();
}
