export class NavComponent {
  constructor(sections, selector = '#petals') {
    this.sections = sections;
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
    this.sections.forEach((page) => {
      const link = document.createElement('a');
      link.href = page.href;
      link.className = 'petal';
      if (page.active) link.classList.add('active');
      link.textContent = page.label;
      this.container.appendChild(link);
      link.addEventListener('click', () => this.setActive(link));
    });
  }

  setupEventListeners() {
    this.toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      this.menu.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
      if (!this.menu.contains(event.target)) {
        this.menu.classList.remove('open');
      }
    });
  }

  setActive(linkElement) {
    document.querySelectorAll('.petal').forEach((item) => item.classList.remove('active'));
    linkElement.classList.add('active');
    this.menu.classList.remove('open');
  }
}