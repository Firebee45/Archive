(() => {
  // Self-contained packed export of item totals.
  // v1 binary (then gzip + base64url):
  //   u8 version=1
  //   u8 flags (bit0 = structures excluded)
  //   varint worldNameLen + utf8 worldName
  //   varint nKnown  — number of (catalogIndex, count) pairs
  //   repeated: varint catalogIndex, varint count   (catalog order preferred)
  //   varint nExtra  — items not in catalog
  //   repeated: varint nameLen + utf8 name + varint count
  //
  // Catalog is WS.ITEM_CATALOG: array of minecraft item registry names (no minecraft: prefix).

  const te = new TextEncoder();

  const writeVarint = (out, n) => {
    n = Math.max(0, Math.floor(Number(n) || 0));
    while (n >= 0x80) {
      out.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    out.push(n);
  };

  const writeStr = (out, s) => {
    const bytes = te.encode(String(s || ''));
    writeVarint(out, bytes.length);
    for (let i = 0; i < bytes.length; i++) out.push(bytes[i]);
  };

  const toBase64Url = bytes => {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  // Build name → catalog index map once
  let catalogMap = null;
  const getCatalogMap = () => {
    if (catalogMap) return catalogMap;
    catalogMap = new Map();
    const cat = WS.ITEM_CATALOG || [];
    for (let i = 0; i < cat.length; i++) catalogMap.set(cat[i], i);
    // also allow space-form keys → underscore form
    return catalogMap;
  };

  const packTotals = ({ name, structures, totals }) => {
    const map = getCatalogMap();
    const known = []; // [index, count]
    const extra = []; // [name, count] not in catalog

    for (const [rawName, count] of totals.entries()) {
      if (!Number.isFinite(count) || count <= 0) continue;
      const key = String(rawName).trim().toLowerCase().replace(/ /g, '_');
      const idx = map.get(key);
      if (idx !== undefined) known.push([idx, count]);
      else extra.push([key, count]);
    }
    known.sort((a, b) => a[0] - b[0]);
    extra.sort((a, b) => a[0].localeCompare(b[0]));

    const raw = [];
    raw.push(1);
    raw.push(structures ? 1 : 0);
    writeStr(raw, name || 'world');
    writeVarint(raw, known.length);
    for (const [idx, count] of known) {
      writeVarint(raw, idx);
      writeVarint(raw, count);
    }
    writeVarint(raw, extra.length);
    for (const [id, count] of extra) {
      writeStr(raw, id);
      writeVarint(raw, count);
    }

    const rawBytes = new Uint8Array(raw);
    if (typeof pako === 'undefined' || !pako.gzip) throw new Error('pako gzip is required');
    const gz = pako.gzip(rawBytes, { level: 9 });
    const text = toBase64Url(gz);
    return {
      text,
      chars: text.length,
      items: known.length + extra.length,
      known: known.length,
      extra: extra.length,
      rawBytes: rawBytes.length,
      gzipBytes: gz.length
    };
  };

  WS.packTotals = packTotals;
})();
