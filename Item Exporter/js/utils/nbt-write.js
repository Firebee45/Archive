(() => {
  class Out {
    constructor() { this.b = new Uint8Array(4096); this.v = new DataView(this.b.buffer); this.n = 0; }
    ensure(k) {
      if (this.n + k <= this.b.length) return;
      let m = this.b.length * 2;
      while (m < this.n + k) m *= 2;
      const nb = new Uint8Array(m); nb.set(this.b.subarray(0, this.n));
      this.b = nb; this.v = new DataView(nb.buffer);
    }
    u8(x) { this.ensure(1); this.b[this.n++] = x & 255; }
    i16(x) { this.ensure(2); this.v.setInt16(this.n, x); this.n += 2; }
    i32(x) { this.ensure(4); this.v.setInt32(this.n, x); this.n += 4; }
    i64(x) { this.ensure(8); this.v.setBigInt64(this.n, BigInt.asIntN(64, BigInt(x))); this.n += 8; }
    f32(x) { this.ensure(4); this.v.setFloat32(this.n, x); this.n += 4; }
    f64(x) { this.ensure(8); this.v.setFloat64(this.n, x); this.n += 8; }
    bytes(a) { this.ensure(a.length); this.b.set(a, this.n); this.n += a.length; }
    // Strings are held as one char per byte (same as the reader), so they round-trip exactly.
    str(s) { this.i16(s.length); this.ensure(s.length); for (let i = 0; i < s.length; i++) this.b[this.n++] = s.charCodeAt(i) & 255; }
    done() { return this.b.slice(0, this.n); }
  }
  const payload = (o, type, tag) => {
    const v = tag.value;
    switch (type) {
      case 1: o.u8(v); break;
      case 2: o.i16(v); break;
      case 3: o.i32(v); break;
      case 4: o.i64(v); break;
      case 5: o.f32(v); break;
      case 6: o.f64(v); break;
      case 7: o.i32(v.length); o.bytes(v); break;
      case 8: o.str(v); break;
      case 9: { const ct = v.length ? v[0].type : (v.childType || 0); o.u8(ct); o.i32(v.length); for (const e of v) payload(o, ct, e); break; }
      case 10: entries(o, v, tag.raw); o.u8(0); break;
      case 11: o.i32(v.length); for (const x of v) o.i32(x); break;
      case 12: o.i32(v.length); for (const x of v) o.i64(x); break;
      default: throw new Error('Unknown NBT tag type ' + type);
    }
  };
  // `raw` is an optional block of already-encoded entries appended to the compound.
  const entries = (o, obj, raw) => {
    for (const name of Object.keys(obj)) { const t = obj[name]; o.u8(t.type); o.str(name); payload(o, t.type, t); }
    if (raw) o.bytes(raw);
  };
  const encodeEntries = obj => { const o = new Out(); entries(o, obj); return o.done(); };
  const encodeNBT = (rootTag, name = '') => { const o = new Out(); o.u8(rootTag.type); o.str(name); payload(o, rootTag.type, rootTag); return o.done(); };
  Object.assign(WS, {encodeEntries, encodeNBT});
})();
