export class CanvasComponent {
  constructor(canvasSelector = '#emberCanvas') {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas?.getContext('2d');
    this.width = 0;
    this.height = 0;
  }
  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.onResize();
  }
  onResize() {}
  clear() {
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }
}
