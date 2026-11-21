WS.emptyChunk = 0;
WS.skippedChunk = 1;

WS.readChunk = (bytes, slot, state) => {
  const loc = slot * 4;
  const sectorOffset = (bytes[loc] << 16) | (bytes[loc+1] << 8) | bytes[loc+2];
  const sectorCount = bytes[loc+3];
  if (!sectorOffset || !sectorCount) return WS.emptyChunk;
  const start = sectorOffset * 4096;
  if (start + 5 > bytes.length) return WS.skippedChunk;
  const length = (bytes[start] * 0x1000000) + (bytes[start+1] << 16) + (bytes[start+2] << 8) + bytes[start+3];
  if (!length || start + 4 + length > bytes.length) return WS.skippedChunk;
  const compression = bytes[start+4] & 0x7f;
  try {
    const payload = bytes.subarray(start+5, start+4+length);
    const nbtBytes = compression === 1 ? pako.ungzip(payload) : compression === 2 ? pako.inflate(payload) : compression === 3 ? payload : null;
    if (!nbtBytes) return WS.skippedChunk;
    const root = WS.parseNBT(nbtBytes, state.keep);
    state.curDV = Number(WS.getScalar(root, 'DataVersion')) || 0;
    return root && root.value && root.value.Level ? root.value.Level : root;
  } catch (e) { return WS.skippedChunk; }
};
