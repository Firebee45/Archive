(() => {
  const {el} = WS;
  el.scanBtn.addEventListener('click', WS.scanWorld);
  el.dimBtn.addEventListener('click', WS.toggleDimMenu);
  el.dimChecks.forEach(c => c.addEventListener('change', WS.syncScan));
})();
