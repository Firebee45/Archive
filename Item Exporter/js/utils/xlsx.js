(() => {
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const HEADER = ['Item ID', 'Quantity'];
  const CONTENT_TYPES = HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  const ROOT_RELS = HEAD + `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${RNS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookXml = ref => HEAD + `<workbook xmlns="${NS}" xmlns:r="${RNS}"><sheets><sheet name="Items" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">Items!${ref}</definedName></definedNames></workbook>`;
  const WORKBOOK_RELS = HEAD + `<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${RNS}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${RNS}/styles" Target="styles.xml"/></Relationships>`;
  const STYLES = HEAD + `<styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const width = len => Math.ceil(len * 1.15) + 3;
  const text = (ref, value, style) => `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  const filterRef = rows => `$A$1:$B$${rows.length + 1}`;
  const sheetXml = rows => {
    let w0 = HEADER[0].length, w1 = HEADER[1].length;
    for (const [name, count] of rows) { w0 = Math.max(w0, name.length); w1 = Math.max(w1, count.toLocaleString().length); }
    let data = `<row r="1">${text('A1', HEADER[0], 1)}${text('B1', HEADER[1], 1)}</row>`;
    rows.forEach(([name, count], i) => { const r = i + 2; data += `<row r="${r}">${text('A' + r, name)}<c r="B${r}" s="2"><v>${count}</v></c></row>`; });
    return HEAD + `<worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="${width(w0)}" customWidth="1"/><col min="2" max="2" width="${width(w1)}" customWidth="1"/></cols><sheetData>${data}</sheetData><autoFilter ref="A1:B${rows.length + 1}"/></worksheet>`;
  };
  WS.buildXlsx = rows => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', CONTENT_TYPES);
    zip.file('_rels/.rels', ROOT_RELS);
    zip.file('xl/workbook.xml', workbookXml(filterRef(rows)));
    zip.file('xl/_rels/workbook.xml.rels', WORKBOOK_RELS);
    zip.file('xl/styles.xml', STYLES);
    zip.file('xl/worksheets/sheet1.xml', sheetXml(rows));
    return zip.generateAsync({type:'uint8array', compression:'DEFLATE'});
  };
})();
