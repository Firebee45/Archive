// Scans region files off the main thread. Several of these run in parallel.
self.window = self;
importScripts(
  'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
  '../utils/helpers.js', '../logic/state.js', '../utils/nbt.js', '../utils/nbt-write.js',
  '../logic/structures.js', '../logic/items.js', '../logic/chunk-reader.js'
);
const S = WS.state;
let useStructures = false;

const scanRegion = async m => {
  const bytes = new Uint8Array(m.bytes);
  const startSlot = m.startSlot || 0;
  const endSlot = m.endSlot === undefined ? 1024 : m.endSlot;
  const slotCount = endSlot - startSlot;
  let chunks = 0, skipped = 0, last = performance.now();
  for (let slot = startSlot; slot < endSlot; slot++) {
    if ((slot & 63) === 63) {
      const now = performance.now();
      if (now - last > 250) { postMessage({type:'progress', index:m.index, frac:(slot - startSlot) / slotCount, done:chunks + skipped}); last = now; }
    }
    const read = WS.readChunk(bytes, slot, S);
    if (read === WS.emptyChunk) continue;
    if (read === WS.skippedChunk) { skipped++; continue; }
    if (!read) { chunks++; continue; }
    try {
      if (useStructures) WS.structures.addChunk(read, m.dim);
      WS.collectChunk(read, m.dim);
      chunks++;
    } catch (e) { skipped++; }
  }
  const out = {type:'done', index:m.index, chunks, skipped};
  if (useStructures) {
    // Containers can only be kept or dropped once every structure box is known, so send them individually.
    out.recs = S.pending; out.boxes = WS.structures.drain(); S.pending = [];
  } else {
    // Otherwise add everything up here and send one small summary.
    out.direct = S.direct; out.summary = S.containerSummary; out.containerCount = S.containerCount; out.packs = S.packs;
    S.direct = new Map(); S.containerSummary = new Map(); S.containerCount = 0; S.packs = [];
  }
  postMessage(out);
};

onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === 'init') {
      S.keep = new Set(m.keep);
      S.excludeStructures = m.structures;
      S.pending = []; S.packs = [];
      useStructures = m.structures;
      postMessage({type:'ready'});
    } else if (m.type === 'region') {
      await scanRegion(m);
    }
  } catch (err) {
    postMessage({type:'fatal', error: err && err.message ? err.message : String(err)});
  }
};
