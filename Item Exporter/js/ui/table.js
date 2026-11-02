(() => {
  const infoLine = text => { const p = document.createElement('p'); p.className = 'info'; p.textContent = text; return p; };
  const ICON_BASE = 'https://mc-api.bisai.dev/v1/assets/items/';
  const makeIcon = name => {
    const id = String(name).trim().replaceAll(' ', '_').toLowerCase();
    const img = document.createElement('img');
    img.className = 'item-icon';
    img.alt = '';
    img.width = img.height = 24;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (!/^[a-z0-9_.\-]+$/.test(id)) { img.classList.add('missing'); return img; }
    img.addEventListener('error', () => { img.classList.add('missing'); img.removeAttribute('src'); }, {once:true});
    img.src = ICON_BASE + encodeURIComponent(id) + '/texture.png';
    return img;
  };
  const makeTable = (headHtml, rows) => {
    const table = document.createElement('table');
    table.innerHTML = headHtml;
    const tbody = document.createElement('tbody');
    for (const [name, count] of rows) {
      const tr = document.createElement('tr'), nameTd = document.createElement('td'), countTd = document.createElement('td');
      const label = document.createElement('span'); label.className = 'name-cell';
      const text = document.createElement('span'); text.textContent = name;
      label.append(makeIcon(name), text); nameTd.appendChild(label); nameTd.className = 'name'; countTd.textContent = count.toLocaleString(); countTd.className = 'num';
      tr.append(nameTd, countTd); tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    const wrap = document.createElement('div'); wrap.className = 'table-wrap'; wrap.appendChild(table);
    return wrap;
  };
  Object.assign(WS, {infoLine, makeIcon, makeTable});
})();
