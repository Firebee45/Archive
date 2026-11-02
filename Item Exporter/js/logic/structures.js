(() => {
  const {getTag, getScalar} = WS;
  const cells = new Map();
  const log = [];
  let count = 0;
  const startsOf = chunk => getTag(getTag(chunk, 'structures'), 'starts') || getTag(getTag(chunk, 'Structures'), 'Starts');
  const boxesOf = start => {
    const children = getTag(start, 'Children');
    if (!children || !Array.isArray(children.value)) return [];
    const out = [];
    for (const child of children.value) {
      const bb = getTag(child, 'BB');
      if (!bb || !Array.isArray(bb.value) || bb.value.length !== 6) continue;
      const [a, b, c, d, e, f] = bb.value;
      out.push([Math.min(a, d), Math.min(b, e), Math.min(c, f), Math.max(a, d), Math.max(b, e), Math.max(c, f)]);
    }
    return out;
  };
  const cellKey = (dim, cx, cz) => `${dim}|${cx}|${cz}`;
  const index = (dim, box) => {
    for (let cx = box[0] >> 4; cx <= box[3] >> 4; cx++) for (let cz = box[2] >> 4; cz <= box[5] >> 4; cz++) {
      const key = cellKey(dim, cx, cz), list = cells.get(key);
      if (list) list.push(box); else cells.set(key, [box]);
    }
    count++;
    log.push([dim, box]);
  };
  const addChunk = (chunk, dim) => {
    const starts = startsOf(chunk);
    if (!starts || !starts.value || typeof starts.value !== 'object') return;
    for (const start of Object.values(starts.value)) {
      if (String(getScalar(start, 'id') || '') === 'INVALID') continue;
      for (const box of boxesOf(start)) index(dim, box);
    }
  };
  const contains = (dim, x, y, z) => {
    const list = cells.get(cellKey(dim, x >> 4, z >> 4));
    if (!list) return false;
    for (const b of list) if (x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5]) return true;
    return false;
  };
  const reset = () => { cells.clear(); log.length = 0; count = 0; };
  const drain = () => log.splice(0, log.length);
  const addBoxes = list => { for (const [dim, box] of list) index(dim, box); };
  WS.structures = {addChunk, contains, reset, drain, addBoxes, get count() { return count; }};
})();
