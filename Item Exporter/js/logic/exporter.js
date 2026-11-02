(() => {
  const {el, state: S, downloadBlob} = WS;
  const exportRows = () => {
    const min = el.exportMinCheck.checked ? Math.max(0, Math.floor(Number(el.exportMinValue.value) || 0)) : 0;
    return [...S.totals.entries()].filter(([, count]) => count >= min).sort((a, b) => a[0].localeCompare(b[0]));
  };
  const updateExportCount = () => {
    const n = exportRows().length;
    el.exportCount.textContent = `${n.toLocaleString()} of ${S.totals.size.toLocaleString()} item types will be included.`;
    el.exportXlsxBtn.disabled = el.exportCsvBtn.disabled = n === 0;
  };
  const exportCSV = () => {
    const lines = [['Item ID', 'Quantity'], ...exportRows()];
    const csv = lines.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    downloadBlob(new Blob([csv], {type:'text/csv;charset=utf-8;'}), 'minecraft-item-totals.csv');
    WS.closeMenu();
  };
  const exportXlsx = async () => {
    const bytes = await WS.buildXlsx(exportRows());
    downloadBlob(new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'minecraft-item-totals.xlsx');
    WS.closeMenu();
  };
  Object.assign(WS, {exportRows, updateExportCount, exportCSV, exportXlsx});
})();
