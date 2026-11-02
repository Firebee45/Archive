(() => {
  const {el, state: S, infoLine, makeIcon, makeTable} = WS;
  const setStatus = (text, error=false) => { el.status.textContent = text; el.status.classList.toggle('error', error); };
  const setState = (text, cls) => { el.stateText.textContent = text; el.stateDot.className = 'dot' + (cls ? ' ' + cls : ''); };
  const setProgress = (pct, title) => {
    if (title !== undefined) el.progressTitle.textContent = title;
    if (pct === null) { el.bar.classList.add('indeterminate'); el.bar.style.width = ''; el.progressPct.textContent = ''; el.track.removeAttribute('aria-valuenow'); return; }
    el.bar.classList.remove('indeterminate');
    const p = Math.max(0, Math.min(100, pct));
    el.bar.style.width = p + '%';
    el.progressPct.textContent = Math.floor(p) + '%';
    el.track.setAttribute('aria-valuenow', String(Math.floor(p)));
  };
  const renderContainers = () => {
    if (!S.containerSummary.size) { el.containerResults.className = 'empty'; el.containerResults.textContent = 'No non-empty containers found yet.'; return; }
    el.containerResults.className = '';
    const rows = [...S.containerSummary.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
    el.containerResults.replaceChildren(infoLine(`${S.containerCount.toLocaleString()} non-empty containers in total.`), makeTable('<thead><tr><th>Container type</th><th class="num">Count</th></tr></thead>', rows));
  };
  const render = () => {
    if (!S.totals.size) { el.results.className = 'empty'; el.results.textContent = 'No items found yet. Scan a world ZIP to see results.'; return; }
    const q = el.search.value.trim().toLowerCase();
    const rows = [...S.totals.entries()].filter(([name]) => name.toLowerCase().includes(q)).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
    if (!rows.length) { el.results.className = 'empty'; el.results.textContent = 'No matching items.'; return; }
    el.results.className = '';
    el.results.replaceChildren(infoLine(`Showing ${rows.length.toLocaleString()} of ${S.totals.size.toLocaleString()} item types.`), makeTable('<thead><tr><th>Item</th><th class="num">Quantity</th></tr></thead>', rows));
  };
  const renderDistribution = () => {
    if (!S.totals.size || !S.totalCount) {
      el.distributionBody.hidden = true;
      el.distributionNote.textContent = 'No items found in this scan.';
      return;
    }

    const rows = [...S.totals.entries()]
      .sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
    const shown = rows.slice(0, 50);
    const omittedTypes = rows.length - shown.length;
    el.itemBarChart.setAttribute('aria-label', `Top ${shown.length} items by percentage of ${S.totalCount.toLocaleString()} total items.`);
    el.distributionNote.textContent = omittedTypes
      ? `Showing the top 50 of ${rows.length.toLocaleString()} item types; ${omittedTypes.toLocaleString()} are omitted. Bar heights are relative to the most common item; labels show each item's share of all ${S.totalCount.toLocaleString()} items.`
      : `Showing all ${rows.length.toLocaleString()} item types. Bar heights are relative to the most common item; labels show each item's share of all ${S.totalCount.toLocaleString()} items.`;

    const columns = shown.map(([name, count], index) => {
      const item = document.createElement('li');
      item.className = 'item-bar-column';
      const icon = makeIcon(name);
      icon.className = 'item-bar-icon';
      icon.alt = name;
      icon.title = name;
      const percentage = count / S.totalCount * 100;
      const percent = document.createElement('span');
      percent.className = 'item-bar-percentage';
      percent.textContent = percentage < 0.1 ? '<0.1%' : `${percentage.toFixed(1)}%`;
      percent.setAttribute('aria-hidden', 'true');
      const track = document.createElement('span');
      track.className = 'item-bar-track';
      track.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'item-bar';
      bar.style.height = `${count / shown[0][1] * 100}%`;
      const hue = shown.length > 1 ? 120 * (1 - index / (shown.length - 1)) : 120;
      bar.style.backgroundColor = `hsl(${hue} 68% 48%)`;
      track.append(bar);
      item.setAttribute('aria-label', `${name}: ${count.toLocaleString()} items, ${percentage.toFixed(2)}% of total`);
      item.title = `${name}: ${count.toLocaleString()} items (${percentage.toFixed(2)}%)`;
      item.append(percent, track, icon);
      return item;
    });
    el.itemBarChart.replaceChildren(...columns);
    el.distributionBody.hidden = false;
  };
  const showResults = () => {
    S.totals = new Map(S.direct);
    S.totalCount = [...S.totals.values()].reduce((a,b) => a+b, 0);
    el.itemKinds.textContent = S.totals.size.toLocaleString();
    el.itemCount.textContent = S.totalCount.toLocaleString();
    el.containers.textContent = S.containerCount.toLocaleString();
    renderDistribution();
    render();
    renderContainers();
    el.exportBtn.disabled = S.totals.size === 0;
  };
  Object.assign(WS, {setStatus, setState, setProgress, render, renderContainers, showResults});
})();
