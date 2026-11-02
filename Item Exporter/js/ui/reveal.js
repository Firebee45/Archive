(() => {
  if (!('IntersectionObserver' in window)) return;
  document.body.classList.add('reveal-ready');
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, {threshold:0.08, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(node => io.observe(node));
})();
