export class SocialsComponent {
  constructor(links, selector = '#socials') {
    this.links = links;
    this.container = document.querySelector(selector);
  }
  init() {
    if (!this.container) return;
    this.render();
  }
  render() {
    this.links.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = item.label;
      this.container.appendChild(link);
    });
  }
}
