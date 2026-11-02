export class AnimationComponent {
  constructor(threshold = 0.15) {
    this.threshold = threshold;
    this.observer = null;
  }
  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, {threshold: this.threshold});
    document.querySelectorAll('.reveal').forEach((element) => {
      this.observer.observe(element);
    });
  }
  observe(element) {
    if (this.observer) this.observer.observe(element);
  }
}
