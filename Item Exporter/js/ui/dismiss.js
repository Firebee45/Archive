document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('.menu-anchor')) WS.closeMenu();
  if (!e.target.closest || !e.target.closest('.split')) WS.closeDimMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { WS.closeMenu(); WS.closeDimMenu(); } });
