(() => {
  const {el} = WS;
  const closeMenu = () => { el.exportMenu.classList.remove('open'); el.exportBtn.setAttribute('aria-expanded', 'false'); };
  const openMenu = () => { WS.updateExportCount(); el.exportMenu.classList.add('open'); el.exportBtn.setAttribute('aria-expanded', 'true'); };
  const closeDimMenu = () => { el.dimMenu.classList.remove('open'); el.dimBtn.setAttribute('aria-expanded', 'false'); };
  const openDimMenu = () => { closeMenu(); el.dimMenu.classList.add('open'); el.dimBtn.setAttribute('aria-expanded', 'true'); };
  const toggleMenu = () => el.exportMenu.classList.contains('open') ? closeMenu() : openMenu();
  const toggleDimMenu = () => el.dimMenu.classList.contains('open') ? closeDimMenu() : openDimMenu();
  Object.assign(WS, {closeMenu, openMenu, closeDimMenu, openDimMenu, toggleMenu, toggleDimMenu});
})();
