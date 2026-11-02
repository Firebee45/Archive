(() => {
  const {el, state: S, tick, setStatus, setState, setProgress} = WS;
  const REGION_RE = /\/?region\/r\.-?\d+\.-?\d+\.mca$/i;
  const NETHER_RE = /(^|\/)(DIM-1|dimensions\/[^/]+\/the_nether)\//i;
  const END_RE = /(^|\/)(DIM1|dimensions\/[^/]+\/the_end)\//i;
  const CUSTOM_DIMENSION_RE = /(^|\/)dimensions\/[^/]+\/.+\/region\//i;
  const EMPTY_CHUNK = 0;
  const SKIPPED_CHUNK = 1;
  const MAX_SCAN_WORKERS = 16;
  const dimOf = name => NETHER_RE.test(name) ? 'nether' : END_RE.test(name) ? 'end' : CUSTOM_DIMENSION_RE.test(name) ? null : 'overworld';
  const dimKeyOf = name => name.replace(REGION_RE, '');
  const syncScan = () => { el.scanBtn.disabled = S.scanning || !S.file || !el.dimChecks.some(c => c.checked); };
  const readChunk = (bytes, slot) => {
    const loc = slot * 4;
    const sectorOffset = (bytes[loc] << 16) | (bytes[loc+1] << 8) | bytes[loc+2];
    const sectorCount = bytes[loc+3];
    if (!sectorOffset || !sectorCount) return EMPTY_CHUNK;
    const start = sectorOffset * 4096;
    if (start + 5 > bytes.length) return SKIPPED_CHUNK;
    const length = (bytes[start] * 0x1000000) + (bytes[start+1] << 16) + (bytes[start+2] << 8) + bytes[start+3];
    if (!length || start + 4 + length > bytes.length) return SKIPPED_CHUNK;
    const compression = bytes[start+4] & 0x7f;
    try {
      const payload = bytes.subarray(start+5, start+4+length);
      const nbtBytes = compression === 1 ? pako.ungzip(payload) : compression === 2 ? pako.inflate(payload) : compression === 3 ? payload : null;
      if (!nbtBytes) return SKIPPED_CHUNK;
      const root = WS.parseNBT(nbtBytes, S.keep);
      S.curDV = Number(WS.getScalar(root, 'DataVersion')) || 0;
      return root && root.value && root.value.Level ? root.value.Level : root;
    } catch (e) { return SKIPPED_CHUNK; }
  };
  const scanRegion = async (file, index, total, token) => {
    const bytes = await file.async('uint8array');
    const dim = dimKeyOf(file.name);
    const stats = {chunks:0, skipped:0};
    let last = performance.now();
    for (let slot = 0; slot < 1024; slot++) {
      if ((slot & 31) === 31 && performance.now() - last > 60) {
        setProgress((index + slot / 1024) / total * 100);
        if (S.live) S.live(stats.chunks + stats.skipped);
        await tick();
        last = performance.now();
        if (token !== S.scanToken) return null;
      }
      const read = readChunk(bytes, slot);
      if (read === EMPTY_CHUNK) continue;
      if (read === SKIPPED_CHUNK) { stats.skipped++; continue; }
      if (!read) { stats.chunks++; continue; }
      try {
        if (S.excludeStructures) WS.structures.addChunk(read, dim);
        WS.collectChunk(read, dim);
        stats.chunks++;
      } catch (e) { stats.skipped++; }
    }
    return stats;
  };
  const showRate = processed => {
    const secs = (performance.now() - S.t0) / 1000;
    const rate = secs > 0.25 ? Math.round(processed / secs) : 0;
    setStatus(`${processed.toLocaleString()} chunks scanned` + (rate ? ` \u00b7 ${rate.toLocaleString()} chunks/s` : ''));
  };
  const stopPool = () => { if (S.pool) { S.pool.forEach(w => w.terminate()); S.pool = null; } };
  const startPool = count => new Promise((resolve, reject) => {
    const workers = [];
    let ready = 0, settled = false;
    const fail = err => { if (settled) return; settled = true; clearTimeout(timer); workers.forEach(w => w.terminate()); reject(err); };
    const timer = setTimeout(() => fail(new Error('Workers did not start')), 10000);
    try {
      for (let i = 0; i < count; i++) {
        const w = new Worker('js/workers/scan-worker.js');
        workers.push(w);
        w.onerror = e => fail(e);
        w.onmessage = e => {
          if (e.data.type === 'fatal') return fail(new Error(e.data.error));
          if (e.data.type === 'ready' && ++ready === count && !settled) { settled = true; clearTimeout(timer); resolve(workers); }
        };
        w.postMessage({type:'init', keep:[...S.keep], structures:S.excludeStructures});
      }
    } catch (err) { fail(err); }
  });
  const runPool = (workers, regions, token) => new Promise((resolve, reject) => {
    const regionParts = workers.length > regions.length
      ? Math.floor(workers.length / regions.length)
      : 1;
    const extraParts = workers.length > regions.length ? workers.length % regions.length : 0;
    const tasks = [];
    const regionReads = new Map();
    const remainingParts = new Map();
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const parts = regionParts + (i < extraParts ? 1 : 0);
      remainingParts.set(region, parts);
      for (let part = 0; part < parts; part++) {
        tasks.push({
          region,
          startSlot: Math.floor(part * 1024 / parts),
          endSlot: Math.floor((part + 1) * 1024 / parts)
        });
      }
    }
    const total = tasks.length, part = new Map(), partDone = new Map();
    let next = 0, finished = 0, chunks = 0, skipped = 0, lastReport = 0;
    const report = (force=false) => {
      const now = performance.now();
      if (!force && now - lastReport < 100) return;
      lastReport = now;
      let p = finished, d = chunks + skipped;
      for (const f of part.values()) p += f;
      for (const n of partDone.values()) d += n;
      showRate(d);
      setProgress(p / total * 100, `Scanning ${regions.length} selected regions (${finished} of ${total} batches, ${workers.length} threads)`);
    };
    const give = w => {
      if (next >= total) return;
      const index = next++;
      const task = tasks[index];
      const {region} = task;
      part.set(index, 0); partDone.set(index, 0);
      let reading = regionReads.get(region);
      if (!reading) {
        reading = region.async('uint8array');
        regionReads.set(region, reading);
      }
      remainingParts.set(region, remainingParts.get(region) - 1);
      reading.then(bytes => {
        if (token !== S.scanToken) return resolve(null);
        const lastPart = remainingParts.get(region) === 0;
        const buffer = lastPart && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
          ? bytes.buffer
          : bytes.slice().buffer;
        w.postMessage({
          type:'region',
          index,
          name:region.name,
          dim:dimKeyOf(region.name),
          startSlot:task.startSlot,
          endSlot:task.endSlot,
          bytes:buffer
        }, [buffer]);
        if (lastPart) regionReads.delete(region);
      }).catch(reject);
    };
    workers.forEach(w => {
      w.onerror = e => reject(new Error(e && e.message ? e.message : 'A scan thread crashed.'));
      w.onmessage = e => {
        const m = e.data;
        if (token !== S.scanToken) return resolve(null);
        if (m.type === 'progress') { part.set(m.index, m.frac); partDone.set(m.index, m.done); report(); return; }
        if (m.type === 'fatal') return reject(new Error(m.error));
        if (m.type !== 'done') return;
        part.delete(m.index); partDone.delete(m.index);
        finished++; chunks += m.chunks; skipped += m.skipped;
        if (S.excludeStructures) {
          WS.structures.addBoxes(m.boxes);
          for (const rec of m.recs) S.pending.push(rec);
        } else {
          for (const [k, v] of m.direct) WS.add(S.direct, k, v);
          for (const [k, v] of m.summary) S.containerSummary.set(k, (S.containerSummary.get(k) || 0) + v);
          S.containerCount += m.containerCount;
          for (const pack of m.packs) S.packs.push(pack);
        }
        report(true);
        if (finished === total) resolve({chunks, skipped}); else give(w);
      };
      give(w);
    });
    report(true);
  });
  const scanWorld = async () => {
    if (!S.file || !el.dimChecks.some(c => c.checked)) return;
    const wanted = new Set(el.dimChecks.filter(c => c.checked).map(c => c.value));
    stopPool();
    const token = ++S.scanToken;
    S.t0 = performance.now(); S.live = null;
    S.scanning = true;
    S.excludeStructures = el.excludeStructures.checked;
    S.keep = new Set(['DataVersion','block_entities','TileEntities','tile_entities', ...(S.excludeStructures ? ['structures','Structures'] : [])]);
    S.pending = [];
    S.packs = [];
    WS.structures.reset();
    WS.closeMenu(); WS.closeDimMenu();
    el.scanBtn.disabled = true; el.exportBtn.disabled = true; el.search.disabled = true;
    S.totals = new Map(); S.direct = new Map(); S.containerSummary = new Map(); S.containerCount = 0; S.totalCount = 0;
    ['itemKinds', 'itemCount', 'containers'].forEach(key => el[key].textContent = '--');
    WS.renderContainers();
    WS.render();
    setState('Scanning', 'busy');
    setProgress(null, 'Opening archive');
    try {
      if (!window.JSZip || !window.pako) throw new Error('Required browser libraries did not load. Check your internet connection and reload this file.');
      setStatus('Reading ZIP archive...');
      const zip = await JSZip.loadAsync(S.file);
      const regions = [];
      let foundCount = 0;
      for (const name in zip.files) {
        if (!Object.prototype.hasOwnProperty.call(zip.files, name)) continue;
        const file = zip.files[name];
        if (file.dir || !REGION_RE.test(file.name)) continue;
        foundCount++;
        const dimension = dimOf(file.name);
        if (dimension !== null && wanted.has(dimension)) regions.push(file);
      }
      if (!foundCount) throw new Error('No .mca region files found. ZIP the world folder itself, or the folder containing level.dat and region/.');
      if (!regions.length) throw new Error('No region files found in the selected dimensions.');
      const total = regions.length;
      let chunks = 0, skipped = 0, pool = null;
      if (window.Worker) {
        setStatus(`Starting scan threads for ${total.toLocaleString()} of ${foundCount.toLocaleString()} region files...`);
        const threads = Math.max(1, Math.min(total * MAX_SCAN_WORKERS, navigator.hardwareConcurrency || 4, MAX_SCAN_WORKERS));
        try { pool = await startPool(threads); } catch (e) { pool = null; }
      } else {
        setStatus(`Scanning ${total.toLocaleString()} of ${foundCount.toLocaleString()} region files in selected dimensions...`);
      }
      if (token !== S.scanToken) return;
      if (pool) {
        S.pool = pool;
        const stats = await runPool(pool, regions, token);
        stopPool();
        if (!stats) return;
        chunks = stats.chunks; skipped = stats.skipped;
      } else {
        let doneProc = 0;
        S.live = n => showRate(doneProc + n);
        for (let i = 0; i < total; i++) {
          if (token !== S.scanToken) return;
          setProgress(i / total * 100, `Scanning region ${i + 1} of ${total}`);
          const stats = await scanRegion(regions[i], i, total, token);
          if (!stats) return;
          chunks += stats.chunks; skipped += stats.skipped;
          doneProc += stats.chunks + stats.skipped;
          showRate(doneProc);
          setProgress((i + 1) / total * 100);
          await tick();
        }
      }
      const excluded = S.excludeStructures ? WS.flushPending() : 0;
      WS.showResults();
      el.search.disabled = false;
      el.exportBtn.disabled = S.totals.size === 0;
      setProgress(100, 'Scan complete');
      setState('Complete', 'done');
      const skippedNote = skipped ? ` ${skipped.toLocaleString()} chunk records were skipped or unreadable.` : '';
      const structureNote = S.excludeStructures ? ` Ignored ${excluded.toLocaleString()} containers inside structure boxes (${WS.structures.count.toLocaleString()} structure pieces found).` : '';
      const secs = (performance.now() - S.t0) / 1000;
      const speed = secs > 0 ? Math.round((chunks + skipped) / secs).toLocaleString() : '0';
      setStatus(`Scanned in ${secs.toFixed(1)} seconds (${speed} chunks/s). Read ${total} region files and ${chunks.toLocaleString()} chunk records.${skippedNote}${structureNote}`);
    } catch (err) {
      stopPool();
      setProgress(0, 'Scan failed');
      setState('Error', 'error');
      setStatus(err && err.message ? err.message : String(err), true);
    } finally {
      S.scanning = false;
      syncScan();
    }
  };
  Object.assign(WS, {dimOf, syncScan, scanWorld});
})();
