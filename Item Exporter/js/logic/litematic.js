(() => {
  const {$, state: S, el} = WS;
  const PER_BARREL = 27, MODERN_DV = 3837, DEFAULT_DV = 4189;
  const ui = {max: $('litMax'), compact: $('litCompact'), keepNamed: $('litKeepNamed'), keepEmpty: $('litKeepEmpty'), noUnstack: $('litNoUnstack'), note: $('litNote'), btn: $('exportLitBtn')};
  const T = (type, value) => ({type, value});
  const list = (childType, arr) => { arr.childType = childType; return T(9, arr); };

  const fullBytes = (c, n) => {
    const cnt = WS.encodeEntries(c.old ? {Count: T(1, n)} : {count: T(3, n)});
    const out = new Uint8Array(c.base.length + cnt.length);
    out.set(c.base); out.set(cnt, c.base.length);
    return out;
  };
  const keyOf = c => {
    let s = c.old ? 'o:' : 'n:';
    for (let i = 0; i < c.base.length; i += 8192) s += String.fromCharCode.apply(null, c.base.subarray(i, i + 8192));
    return s;
  };
  const readOpts = () => ({compact: ui.compact.checked, keepNamed: ui.keepNamed.checked, keepEmpty: ui.keepEmpty.checked, noUnstack: ui.noUnstack.checked, minOn: el.exportMinCheck.checked, minValue: el.exportMinValue.value});
  const fillBoxes = (entries, stacks) => {
    for (let i = 0; i < stacks.length; i += PER_BARREL) {
      entries.push({box: {boxId: 'minecraft:shulker_box', plain: stacks.slice(i, i + PER_BARREL).map((s, k) => ({slot: k, bytes: fullBytes(s.c, s.n)}))}});
    }
  };

  // One entry per shulker box and per loose shulker item taken out of a container.
  let cache = null;
  const gather = () => {
    const o = readOpts();
    const key = `${o.compact}|${o.keepNamed}|${o.keepEmpty}|${o.noUnstack}|${o.minOn}|${o.minOn ? o.minValue : ''}`;
    const packs = S.packs || [];
    if (cache && cache.packs === packs && cache.len === packs.length && cache.key === key) return cache.res;
    const entries = [], formats = new Set();
    const pool = [], merge = [], named = [];
    let dv = 0;
    // Same quantity filter as the Excel/CSV export: item types whose world total is under the minimum are left out.
    const allowed = o.minOn ? new Set(WS.exportRows().map(r => r[0])) : null;
    const dropped = c => !(o.keepNamed && c.named) && ((allowed && !allowed.has(WS.itemName(c.id))) || (o.noUnstack && c.max === 1));
    for (const p of packs) {
      if (p.dv) { dv = Math.max(dv, p.dv); formats.add(p.dv >= MODERN_DV); }
      let keep = p.plain.filter(c => !dropped(c));
      if (o.compact) {
        const all = keep;
        keep = [];
        for (const c of all) { if (o.keepNamed && c.named) named.push({c, n: c.n}); else merge.push(c); }
      }
      if (p.small) { for (const c of keep) pool.push({c, n: c.n}); }
      else if (keep.length) entries.push({box: {boxId: p.boxId, plain: keep.map(c => ({slot: c.slot, bytes: fullBytes(c, c.n)}))}});
      for (const l of p.loose) {
        if (l.empty && !o.keepEmpty && !(o.keepNamed && l.named)) continue;
        entries.push({loose: l.bytes});
      }
    }
    // Hoppers, droppers and dispensers hold under 27 stacks, so their stacks are pooled and repacked full.
    fillBoxes(entries, pool);
    if (merge.length || named.length) {
      const groups = new Map();
      for (const c of merge) {
        if (!(c.n > 0)) continue;
        const k = keyOf(c), g = groups.get(k);
        if (g) g.total += c.n; else groups.set(k, {c, total: c.n});
      }
      const stacks = named.slice();
      for (const g of [...groups.values()].sort((a, b) => a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : 0)) {
        const max = Math.max(1, g.c.max);
        for (let t = g.total; t > 0; t -= max) stacks.push({c: g.c, n: Math.min(max, t)});
      }
      fillBoxes(entries, stacks);
    }
    const res = {entries, dv: dv || DEFAULT_DV, mixed: formats.size > 1};
    cache = {packs, len: packs.length, key, res};
    return res;
  };

  const boxItem = (p, slot, modern) => {
    if (modern) {
      const items = p.plain.map(c => T(10, {slot: T(3, c.slot), item: {type: 10, value: {}, raw: c.bytes}}));
      return T(10, {Slot: T(1, slot), id: T(8, p.boxId), count: T(3, 1), components: T(10, {'minecraft:container': list(10, items)})});
    }
    const items = p.plain.map(c => ({type: 10, value: {Slot: T(1, c.slot)}, raw: c.bytes}));
    return T(10, {Slot: T(1, slot), id: T(8, p.boxId), Count: T(1, 1), tag: T(10, {BlockEntityTag: T(10, {id: T(8, 'minecraft:shulker_box'), Items: list(10, items)})})});
  };
  const looseItem = (bytes, slot) => ({type: 10, value: {Slot: T(1, slot)}, raw: bytes});

  const build = (entries, dv, X, Z) => {
    const modern = dv >= MODERN_DV;
    const barrels = Math.ceil(entries.length / PER_BARREL);
    const total = X * Z;
    const words = new Uint32Array(Math.ceil(total * 2 / 64) * 2);
    const tiles = [];
    for (let b = 0; b < barrels; b++) {
      const x = b % X, z = Math.floor(b / X);
      words[(b * 2) >> 5] |= 1 << ((b * 2) & 31);
      const items = [];
      for (let s = 0; s < PER_BARREL; s++) {
        const e = entries[b * PER_BARREL + s];
        if (!e) break;
        items.push(e.box ? boxItem(e.box, s, modern) : looseItem(e.loose, s));
      }
      tiles.push(T(10, {id: T(8, 'minecraft:barrel'), x: T(3, x), y: T(3, 0), z: T(3, z), Items: list(10, items)}));
    }
    const longs = [];
    for (let k = 0; k < words.length; k += 2) longs.push(BigInt.asIntN(64, (BigInt(words[k + 1]) << 32n) | BigInt(words[k])));
    const size = () => T(10, {x: T(3, X), y: T(3, 1), z: T(3, Z)});
    const region = T(10, {
      Position: T(10, {x: T(3, 0), y: T(3, 0), z: T(3, 0)}),
      Size: size(),
      PendingBlockTicks: list(10, []), PendingFluidTicks: list(10, []), Entities: list(10, []),
      TileEntities: list(10, tiles),
      BlockStatePalette: list(10, [
        T(10, {Name: T(8, 'minecraft:air')}),
        T(10, {Name: T(8, 'minecraft:barrel'), Properties: T(10, {facing: T(8, 'up'), open: T(8, 'false')})})
      ]),
      BlockStates: T(12, longs)
    });
    const now = BigInt(Date.now());
    const root = T(10, {
      Version: T(3, 6), SubVersion: T(3, 1), MinecraftDataVersion: T(3, dv),
      Metadata: T(10, {Name: T(8, 'Item Barrels'), Author: T(8, 'Item Exporter'), Description: T(8, ''), RegionCount: T(3, 1), TimeCreated: T(4, now), TimeModified: T(4, now), TotalBlocks: T(3, barrels), TotalVolume: T(3, total), EnclosingSize: size()}),
      Regions: T(10, {Items: region})
    });
    return WS.encodeNBT(root, '');
  };

  // Smallest rectangle that holds every barrel: fewest spare cells, then closest to square (max 2:1).
  const bestGrid = n => {
    if (n < 1) return [1, 1];
    let best = null;
    const limit = Math.max(2, Math.ceil(Math.sqrt(n)) * 2);
    for (let x = 1; x <= limit; x++) {
      const z = Math.ceil(n / x), ratio = Math.max(x / z, z / x);
      if (n > 2 && ratio > 2) continue;
      const score = [x * z - n, ratio];
      if (!best || score[0] < best.s[0] || (score[0] === best.s[0] && score[1] < best.s[1])) best = {x, z, s: score};
    }
    return best ? [best.x, best.z] : [1, n];
  };
  const update = () => {
    const {entries, mixed} = gather();
    const barrels = Math.ceil(entries.length / PER_BARREL);
    ui.btn.disabled = !barrels;
    const cap = Number(ui.max.value) >= 1 ? Math.floor(Number(ui.max.value)) : Infinity;
    ui.note.textContent = barrels
      ? `${entries.length.toLocaleString()} shulker boxes in ${barrels.toLocaleString()} barrels` + (barrels > cap ? `, split into ${Math.ceil(barrels / cap)} files.` : '.') + (mixed ? ' This world mixes old and new chunk formats, so some items may not load.' : '')
      : 'No containers to export.';
  };
  const exportLitematic = async () => {
    const {entries, dv} = gather();
    const barrels = Math.ceil(entries.length / PER_BARREL);
    if (!barrels) return;
    const maxBarrels = Number(ui.max.value) >= 1 ? Math.floor(Number(ui.max.value)) : Infinity;
    const perFile = maxBarrels * PER_BARREL;
    if (barrels <= maxBarrels) {
      const [X, Z] = bestGrid(barrels);
      WS.downloadBlob(new Blob([pako.gzip(build(entries, dv, X, Z))], {type: 'application/octet-stream'}), 'item-barrels.litematic');
    } else {
      const zip = new JSZip();
      const parts = Math.ceil(entries.length / perFile);
      for (let i = 0; i < parts; i++) {
        const slice = entries.slice(i * perFile, (i + 1) * perFile);
        const [X, Z] = bestGrid(Math.ceil(slice.length / PER_BARREL));
        zip.file(`item-barrels-${i + 1}.litematic`, pako.gzip(build(slice, dv, X, Z)));
        await WS.tick();
      }
      WS.downloadBlob(await zip.generateAsync({type: 'blob'}), 'item-barrels.zip');
    }
    WS.closeMenu();
  };

  el.exportBtn.addEventListener('click', update);
  [ui.max, el.exportMinValue].forEach(i => i.addEventListener('input', () => { const v = i.value.replace(/\D/g, ''); if (v !== i.value) i.value = v; }));
  ui.max.addEventListener('input', update);
  [ui.compact, ui.keepNamed, ui.keepEmpty, ui.noUnstack, el.exportMinCheck].forEach(c => c.addEventListener('change', update));
  el.exportMinValue.addEventListener('input', update);
  ui.btn.addEventListener('click', exportLitematic);
  Object.assign(WS, {exportLitematic});
})();
