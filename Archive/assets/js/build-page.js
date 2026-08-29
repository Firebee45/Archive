import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';
import { parseBuildMarkdown, parseTagColours } from './build-markdown.js';
import { NavComponent } from '../../../Landing%20page/assets/components/nav.js';
import { FirebeeNav } from '../../../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../../../Landing%20page/assets/config.js';

function formatBytes(bytes) {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileNameFromPath(path) {
    return path.split('/').pop();
}

function fileExtension(name) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 6) : 'FILE';
}

async function fetchFileSize(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        const length = response.headers.get('content-length');
        return length ? parseInt(length, 10) : null;
    } catch (error) {
        return null;
    }
}

function buildSection(title, innerHTML, className) {
    return `<div class="Archive-build-section ${className}"><h2 class="Archive-build-section-title">${title}</h2>${innerHTML}</div>`;
}

async function resolveDownloads(downloads) {
    return Promise.all(downloads.map(async (entry) => {
        const path = entry.path;
        const name = entry.name || fileNameFromPath(path);
        const size = await fetchFileSize(path);
        return { path, name, size };
    }));
}

function renderDownloadCards(items) {
    const cards = items.map(item => `
        <div class="Archive-download-card">
            <div class="Archive-download-icon">${fileExtension(item.name)}</div>
            <div class="Archive-download-meta">
                <span class="Archive-download-name">${item.name}</span>
                <span class="Archive-download-size">${item.size !== null ? formatBytes(item.size) : ''}</span>
            </div>
            <a class="Archive-download-btn" href="${item.path}" download title="Download">&#8681;</a>
        </div>`).join('');

    const allButton = items.length > 1
        ? `<button type="button" class="Archive-download-all">Download All (.zip)</button>`
        : '';

    return `${allButton}<div class="Archive-download-list">${cards}</div>`;
}

function wireDownloadAll(section, items) {
    const button = section.querySelector('.Archive-download-all');
    if (!button) return;
    button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Zipping…';
        try {
            const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
            const zip = new JSZip();
            await Promise.all(items.map(async (item) => {
                const response = await fetch(item.path);
                const blob = await response.blob();
                zip.file(item.name, blob);
            }));
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'download.zip';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            button.textContent = 'Download All (.zip)';
        } catch (error) {
            button.textContent = 'Failed, try again';
        }
        button.disabled = false;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const nav = new NavComponent(getNavSections());
    nav.init();

    const page = document.querySelector('.Archive-build-page');
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
        page.innerHTML = '<p class="Archive-build-error">No build specified.</p>';
        return;
    }

    try {
        const [buildResponse, colorsResponse] = await Promise.all([
            fetch(`listing-data/${id}.md`),
            fetch('listing-data/tag-colours.md').catch(() => null)
        ]);

        if (!buildResponse.ok) throw new Error(`Status ${buildResponse.status}`);

        const build = parseBuildMarkdown(await buildResponse.text());
        let tagColors = {};
        if (colorsResponse && colorsResponse.ok) {
            tagColors = parseTagColours(await colorsResponse.text());
        }

        document.title = `${build.title} — FireBee Archive`;

        document.querySelector('.Archive-build-image').src = build.image;
        document.querySelector('.Archive-build-image').alt = build.title;
        document.querySelector('.Archive-build-title').textContent = build.title;
        document.querySelector('.Archive-build-description').innerHTML = marked.parse(build.description || '');
        document.querySelector('.Archive-build-tags').innerHTML = (build.tags || []).map(tag => {
            const hexColor = tagColors[tag];
            const style = hexColor ? `style="background-color:${hexColor}8c;border-color:${hexColor}aa;color:#fff;"` : '';
            return `<span class="Archive-tag" ${style}>${tag}</span>`;
        }).join('');

        const creditsEl = document.querySelector('.Archive-build-credits');
        if (build.credits && build.credits.length) {
            creditsEl.innerHTML = `<h2 class="Archive-build-credits-title">Credits</h2><ul class="Archive-build-credits-list">${build.credits.map(credit => `<li><span class="Archive-build-credit-name">${marked.parseInline(credit.name)}</span><span class="Archive-build-credit-note">${marked.parseInline(credit.note || '')}</span></li>`).join('')}</ul>`;
        }

        const extra = document.querySelector('.Archive-build-extra');
        const sections = [];

        if (build.features && build.features.length) {
            sections.push(buildSection('Features', `<ul class="Archive-build-list">${build.features.map(f => `<li>${marked.parseInline(f)}</li>`).join('')}</ul>`, 'Archive-build-features'));
        }

        if (build.downsides && build.downsides.length) {
            sections.push(buildSection('Downsides', `<ul class="Archive-build-list Archive-build-list--downside">${build.downsides.map(d => `<li>${marked.parseInline(d)}</li>`).join('')}</ul>`, 'Archive-build-downsides'));
        }

        if (build.info) {
            sections.push(buildSection('Info', `<div>${marked.parse(build.info)}</div>`, 'Archive-build-infotext'));
        }

        if (build.notes) {
            sections.push(buildSection('Notes', `<div class="Archive-build-note">${marked.parse(build.notes)}</div>`, 'Archive-build-notes'));
        }

        if (build.gallery && build.gallery.length) {
            const images = build.gallery.map(src => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${build.title}" loading="lazy"></a>`).join('');
            sections.push(buildSection('Gallery', `<div class="Archive-build-gallery-grid">${images}</div>`, 'Archive-build-gallery'));
        }

        extra.innerHTML = sections.join('');

        if (build.downloads && build.downloads.length) {
            const downloadSection = document.createElement('div');
            downloadSection.className = 'Archive-build-section Archive-build-downloads';
            extra.appendChild(downloadSection);

            const items = await resolveDownloads(build.downloads);
            downloadSection.innerHTML = `<h2 class="Archive-build-section-title">Downloads</h2>${renderDownloadCards(items)}`;
            wireDownloadAll(downloadSection, items);
        }
    } catch (error) {
        page.innerHTML = '<p class="Archive-build-error">Build not found.</p>';
    }
});