// Scans region files off the main thread. Several of these run in parallel.
self.window = self;
importScripts(
  'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js',
  '../utils/helpers.js', '../logic/state.js', '../utils/nbt.js', '../utils/nbt-write.js',
  '../logic/structures.js', '../logic/items.js'
);
const S = WS.state;
let useStructures = false;
const EMPTY_CHUNK = 0;
const SKIPPED_CHUNK = 1;

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
    const read = readChunk(bytes, slot);
    if (read === EMPTY_CHUNK) continue;
    if (read === SKIPPED_CHUNK) { skipped++; continue; }
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
