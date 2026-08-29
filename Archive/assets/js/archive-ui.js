function normalizeVersion(v) {
    const val = (v || '').trim().toLowerCase();
    return val === 'bedrock' ? 'bedrock' : 'java';
}

function createCardHTML(item, tagColors, globalIndex) {
    const tagsHTML = (item.tags || [])
        .map(tag => {
            const hexColor = tagColors[tag];
            const inlineStyle = hexColor
                ? `style="background-color: ${hexColor}8c; border-color: ${hexColor}aa; color: #fff;"`
                : '';

            return `<span class="Archive-tag" ${inlineStyle}>${tag}</span>`;
        })
        .join('\n                ');

    return `
        <a href="build.html?id=${item.slug}" class="Archive-card Archive-in-view" data-index="${globalIndex}" data-version="${normalizeVersion(item.version)}">
            <div class="Archive-art">
                <div class="Archive-thumb">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>              
                <div class="Archive-glass"></div>
                <div class="Archive-seam"></div>
            </div>
            <div class="Archive-tagfloat">
                ${tagsHTML}
            </div>
            <div class="Archive-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
            <span class="Archive-cta">&gt;</span>
        </a>`;
}

function createSectionHTML(versionKey, label) {
    return `
        <section class="Archive-section" data-section="${versionKey}">
            <div class="Archive-section-head">
                <button type="button" class="Archive-section-title" data-role="isolate">
                    <span class="Archive-section-titletext">${label}</span>
                    <span class="Archive-section-count"></span>
                </button>
                <button type="button" class="Archive-section-back" data-role="back">go back</button>
            </div>
            <div class="Archive-grid-wrap">
                <div class="Archive-grid" data-grid="${versionKey}"></div>
            </div>
            <button type="button" class="Archive-seemore" data-role="seemore">See more</button>
        </section>`;
}

const SECTIONS = [
    { key: 'java', label: 'Java' },
    { key: 'bedrock', label: 'Bedrock' }
];

function getColumnCount(gridEl) {
    const style = getComputedStyle(gridEl);
    const cols = style.gridTemplateColumns.split(' ').filter(Boolean).length;
    return cols || 1;
}

function applyClamp(sectionEl) {
    if (sectionEl.classList.contains('is-empty')) return;
    if (sectionEl.classList.contains('is-isolated')) return;
    if (sectionEl.dataset.expanded === 'true') return;

    const gridEl = sectionEl.querySelector('.Archive-grid');
    const wrap = sectionEl.querySelector('.Archive-grid-wrap');
    const seeMoreBtn = sectionEl.querySelector('.Archive-seemore');
    if (!gridEl || !wrap) return;

    const visibleCards = Array.from(gridEl.querySelectorAll('.Archive-card'))
        .filter(card => !card.classList.contains('is-hidden'));

    if (visibleCards.length === 0) {
        wrap.style.maxHeight = 'none';
        wrap.classList.remove('is-clamped');
        if (seeMoreBtn) seeMoreBtn.classList.add('is-hidden-btn');
        return;
    }

    const cols = getColumnCount(gridEl);
    const rowsVisible = 2;
    const tops = [];
    visibleCards.forEach(card => {
        const t = Math.round(card.offsetTop);
        if (!tops.includes(t)) tops.push(t);
    });
    tops.sort((a, b) => a - b);

    if (tops.length <= rowsVisible || cols <= 0) {
        wrap.style.maxHeight = 'none';
        wrap.classList.remove('is-clamped');
        if (seeMoreBtn) seeMoreBtn.classList.add('is-hidden-btn');
        return;
    }

    const peek = 40;
    const cutoff = tops[rowsVisible] + peek;
    wrap.style.maxHeight = cutoff + 'px';
    wrap.classList.add('is-clamped');
    if (seeMoreBtn) {
        seeMoreBtn.classList.remove('is-hidden-btn');
        seeMoreBtn.textContent = 'See more';
    }
}

function updateNoMatchState(sectionEl) {
    if (sectionEl.classList.contains('is-empty')) return;
    const gridEl = sectionEl.querySelector('.Archive-grid');
    if (!gridEl) return;
    const cards = Array.from(gridEl.querySelectorAll('.Archive-card'));
    const anyVisible = cards.some(card => !card.classList.contains('is-hidden'));
    let note = sectionEl.querySelector('.Archive-section-nomatch');
    if (!anyVisible) {
        if (!note) {
            note = document.createElement('p');
            note.className = 'Archive-section-nomatch';
            gridEl.after(note);
        }
        sectionEl.classList.add('is-nomatch');
    } else if (note) {
        note.remove();
        sectionEl.classList.remove('is-nomatch');
    }
    if (note) note.textContent = 'No matches in this section.';
}

function isolateSection(container, targetKey) {
    container.classList.add('is-isolated-view');
    container.querySelectorAll('.Archive-section').forEach(sectionEl => {
        const isTarget = sectionEl.dataset.section === targetKey;
        if (isTarget) {
            sectionEl.classList.add('is-isolated');
            sectionEl.classList.remove('is-hidden-section');
            const wrap = sectionEl.querySelector('.Archive-grid-wrap');
            if (wrap) {
                wrap.style.maxHeight = 'none';
                wrap.classList.remove('is-clamped');
            }
            const seeMoreBtn = sectionEl.querySelector('.Archive-seemore');
            if (seeMoreBtn) seeMoreBtn.classList.add('is-hidden-btn');
        } else {
            sectionEl.classList.add('is-hidden-section');
            sectionEl.classList.remove('is-isolated');
        }
    });
}

function restoreStacked(container) {
    container.classList.remove('is-isolated-view');
    container.querySelectorAll('.Archive-section').forEach(sectionEl => {
        sectionEl.classList.remove('is-hidden-section', 'is-isolated');
        applyClamp(sectionEl);
        updateNoMatchState(sectionEl);
    });
}

function wireSectionEvents(container, sectionEl) {
    const key = sectionEl.dataset.section;
    const titleBtn = sectionEl.querySelector('[data-role="isolate"]');
    const backBtn = sectionEl.querySelector('[data-role="back"]');
    const seeMoreBtn = sectionEl.querySelector('[data-role="seemore"]');

    if (titleBtn) {
        titleBtn.addEventListener('click', () => {
            if (sectionEl.classList.contains('is-isolated')) {
                restoreStacked(container);
            } else {
                isolateSection(container, key);
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            restoreStacked(container);
        });
    }

    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', () => {
            const wrap = sectionEl.querySelector('.Archive-grid-wrap');
            const isExpanded = sectionEl.dataset.expanded === 'true';
            if (isExpanded) {
                sectionEl.dataset.expanded = 'false';
                applyClamp(sectionEl);
            } else {
                sectionEl.dataset.expanded = 'true';
                if (wrap) {
                    wrap.style.maxHeight = 'none';
                    wrap.classList.remove('is-clamped');
                }
                seeMoreBtn.textContent = 'Show less';
            }
        });
    }
}

export function refreshArchiveLayout(container) {
    if (!container) return;
    container.querySelectorAll('.Archive-section').forEach(sectionEl => {
        applyClamp(sectionEl);
        updateNoMatchState(sectionEl);
    });
}

let resizeBound = false;
function bindResizeOnce(container) {
    if (resizeBound) return;
    resizeBound = true;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => refreshArchiveLayout(container), 150);
    });
}

export function renderArchiveGrid(container, dataPayload) {
    const { cards, tagColors } = dataPayload;

    if (!cards || cards.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--Archive-ember); font-size: 0.8rem;">Archive manifest empty or unreadable.</p>`;
        return;
    }

    container.innerHTML = SECTIONS.map(s => createSectionHTML(s.key, s.label)).join('\n');

    const groups = { java: [], bedrock: [] };
    cards.forEach((item, index) => {
        groups[normalizeVersion(item.version)].push({ item, index });
    });

    SECTIONS.forEach(({ key }) => {
        const sectionEl = container.querySelector(`.Archive-section[data-section="${key}"]`);
        const gridEl = sectionEl.querySelector('.Archive-grid');
        const countEl = sectionEl.querySelector('.Archive-section-count');
        const entries = groups[key];

        if (countEl) countEl.textContent = entries.length;

        if (entries.length === 0) {
            sectionEl.classList.add('is-empty');
            gridEl.innerHTML = `<p class="Archive-empty-note">No ${key} builds yet.</p>`;
            const seeMoreBtn = sectionEl.querySelector('.Archive-seemore');
            if (seeMoreBtn) seeMoreBtn.remove();
        } else {
            gridEl.innerHTML = entries.map(({ item, index }) => createCardHTML(item, tagColors, index)).join('\n');
        }

        wireSectionEvents(container, sectionEl);
    });

    refreshArchiveLayout(container);
    bindResizeOnce(container);
}