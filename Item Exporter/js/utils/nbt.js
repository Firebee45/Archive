(() => {
  const decoder = new TextDecoder('utf-8', {ignoreBOM:true});
  const getTag = (compound, name) => {
    if (!compound) return null;
    if (compound.value && Object.prototype.hasOwnProperty.call(compound.value, name)) return compound.value[name];
    return null;
  };
  const getScalar = (compound, name) => {
    const tag = getTag(compound, name);
    if (!tag) return undefined;
    if (tag.value !== undefined && (typeof tag.value !== 'object' || tag.value === null)) return tag.value;
    return undefined;
  };
  const parseNBT = (bytes, keep) => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let pos = 0;
    const need = n => { if (pos+n > view.byteLength) throw new Error('Unexpected end of NBT data'); };
    const u8 = () => { need(1); return view.getUint8(pos++); };
    const i16 = () => { need(2); const v=view.getInt16(pos); pos+=2; return v; };
    const i32 = () => { need(4); const v=view.getInt32(pos); pos+=4; return v; };
    const i64 = () => { need(8); const v=view.getBigInt64(pos); pos+=8; return (v >= -9007199254740991n && v <= 9007199254740991n) ? Number(v) : v; };
    const f32 = () => { need(4); const v=view.getFloat32(pos); pos+=4; return v; };
    const f64 = () => { need(8); const v=view.getFloat64(pos); pos+=8; return v; };
    const str = () => { const n=u8()*256+u8(); need(n); const s=decoder.decode(bytes.subarray(pos,pos+n)); pos+=n; return s; };
    const SIZES = {1:1,2:2,3:4,4:8,5:4,6:8};
    const skipStr = () => { const n=u8()*256+u8(); need(n); pos+=n; };
    const skip = type => {
      const s = SIZES[type];
      if (s) { need(s); pos+=s; return; }
      switch (type) {
        case 7: { const n=i32(); if(n<0) throw new Error('Bad byte array'); need(n); pos+=n; return; }
        case 8: skipStr(); return;
        case 9: { const ct=u8(), n=i32(); if(n<0) throw new Error('Bad list'); const cs=SIZES[ct]; if (cs) { need(n*cs); pos+=n*cs; } else for (let i=0;i<n;i++) skip(ct); return; }
        case 10: { while (true) { const t=u8(); if (t===0) return; skipStr(); skip(t); } }
        case 11: { const n=i32(); if(n<0) throw new Error('Bad int array'); need(n*4); pos+=n*4; return; }
        case 12: { const n=i32(); if(n<0) throw new Error('Bad long array'); need(n*8); pos+=n*8; return; }
        default: throw new Error('Unknown NBT tag type '+type);
      }
    };
    const payload = (type, depth=0, filt=false) => {
      if(depth>80) throw new Error('NBT nesting too deep');
      switch(type) {
        case 1: { need(1); const v=view.getInt8(pos); pos++; return v; }
        case 2: return i16();
        case 3: return i32();
        case 4: return i64();
        case 5: return f32();
        case 6: return f64();
        case 7: { const n=i32(); if(n<0 || n>bytes.length) throw new Error('Bad byte array'); need(n); const a=bytes.slice(pos,pos+n); pos+=n; return a; }
        case 8: return str();
        case 9: { const childType=u8(), n=i32(); if(n<0 || n>1000000) throw new Error('Bad list'); const arr=[]; for(let i=0;i<n;i++) arr.push({type:childType,value:payload(childType,depth+1)}); arr.childType=childType; return arr; }
        case 10: { const obj={}; while(true) { const t=u8(); if(t===0) break; const name=str(); if (filt && name!=='Level' && !keep.has(name)) { skip(t); continue; } obj[name]={type:t,value:payload(t,depth+1,filt && name==='Level')}; } return obj; }
        case 11: { const n=i32(); if(n<0 || n>1000000) throw new Error('Bad int array'); const a=[]; for(let i=0;i<n;i++) a.push(i32()); return a; }
        case 12: { const n=i32(); if(n<0 || n>1000000) throw new Error('Bad long array'); const a=[]; for(let i=0;i<n;i++) a.push(i64()); return a; }
        default: throw new Error('Unknown NBT tag type '+type);
      }
    };
    const type=u8();
    if(type===0) return null;
    const name=str();
    return {type, name, value:payload(type,0,!!keep)};
  };
  Object.assign(WS, {getTag, getScalar, parseNBT});
})();