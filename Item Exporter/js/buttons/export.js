(() => {
  const {el} = WS;
  el.exportBtn.addEventListener('click', WS.toggleMenu);
  el.exportMinCheck.addEventListener('change', () => { el.exportMinValue.disabled = !el.exportMinCheck.checked; WS.updateExportCount(); });
  el.exportMinValue.addEventListener('input', WS.updateExportCount);
  el.exportXlsxBtn.addEventListener('click', WS.exportXlsx);
  el.exportCsvBtn.addEventListener('click', WS.exportCSV);
})();
