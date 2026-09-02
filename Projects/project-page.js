import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';
import { NavComponent } from '../Landing%20page/assets/components/nav.js';
import { FirebeeNav } from '../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../Landing%20page/assets/config.js';
import { fetchDiscordProfile, getTemporaryArchiveImage, loadProjectFile, loadTimeline } from './projects-data.js';

async function involvedMarkup(items) {
    const profiles = await Promise.all(items.map(async item => {
        const profile = item.profile || (item.discordId ? await fetchDiscordProfile(item.discordId) : { name: item.name, avatar: '' });
        return `<article class="Project-profile">
            <div class="Project-profile-avatar">${profile.avatar ? `<a href="${profile.avatar}" target="_blank" rel="noopener"><img src="${profile.avatar}" alt="Open ${profile.name}'s Discord avatar"></a>` : ''}</div>
            <div><h3>${profile.name}</h3><p>${item.contribution || 'Contributor'}</p></div>
        </article>`;
    }));
    return profiles.join('') || '<p class="Project-page-empty">Nothing listed yet.</p>';
}

function chronologicalDayMarkdown(markdown) {
    const marker = /<!--\s*update-timestamp:\s*(.+?)\s*-->/g;
    const matches = [...markdown.matchAll(marker)];
    if (matches.length < 2) return markdown;

    const preamble = markdown.slice(0, matches[0].index);
    const blocks = matches.map((match, index) => {
        const start = match.index;
        const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
        return { timestamp: Date.parse(match[1]), content: markdown.slice(start, end) };
    });

    blocks.sort((a, b) => a.timestamp - b.timestamp);
    return preamble + blocks.map(block => block.content).join('');
}

function timelineMarkup(timeline, project) {
    if (!timeline.length) return '<p class="Project-page-empty">No timeline entries yet.</p>';
    return timeline.map(entry => {
        entry = { ...entry, markdown: chronologicalDayMarkdown(entry.markdown) };
        const base = new URL(`listing-data/${project.projectFolder}/timeline/${entry.date}.md`, location.href);
        const images = [...entry.markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => {
            const target = match[1].trim();
            return /^(?:[a-z]+:|\/|#)/i.test(target) ? target : new URL(target, base).href;
        });
        const markdown = entry.markdown.replace(/!\[[^\]]*\]\([^)]*\)\s*/g, '').replace(/^##\s+Media\s*$/gim, '').replace(/(\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, target, suffix) => {
            if (/^(?:[a-z]+:|\/|#)/i.test(target)) return match;
            return `${prefix}${new URL(target, base).href}${suffix}`;
        });
        const media = images.length ? `<div class="Project-timeline-media"><h3>Media</h3>${carouselMarkup([...new Set(images)])}</div>` : '';
        return `<article class="Project-timeline-entry"><time>${entry.date}</time><div>${renderTimelineMarkdown(markdown)}</div>${media}</article>`;
    }).join('');
}

function normalizeDiscordMarkdown(markdown) {
    const preservedLinks = [];
    let normalized = markdown
        .replace(/<a?:[^:\s>]+:\d+>/g, '')
        .replace(/<#[0-9]+>/g, '<span class="Project-discord-reference">(different channel)</span>')
        .replace(/\[([^\]]*)\]\((https:\/\/discord\.com\/channels\/[^)]+)\)/g, (match, label, url) => {
            if (label.trim() !== url.trim()) {
                const token = `__PRESERVED_DISCORD_LINK_${preservedLinks.length}__`;
                preservedLinks.push(match);
                return token;
            }
            return `<a class="Project-discord-reference" href="${url}" target="_blank" rel="noopener">(different channel)</a>`;
        });

    normalized = normalized.replace(/https:\/\/discord\.com\/channels\/[^\s<)]+/g, (url) => {
        const cleanUrl = url.replace(/[.,!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);
        return `<a class="Project-discord-reference" href="${cleanUrl}" target="_blank" rel="noopener">(different channel)</a>${trailing}`;
    });

    return normalized.replace(/__PRESERVED_DISCORD_LINK_(\d+)__/g, (match, index) => preservedLinks[Number(index)]);
}

function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ansiToHtml(value) {
    const colours = { '31': 'ansi-red', '32': 'ansi-green', '33': 'ansi-yellow', '37': 'ansi-white' };
    let active = '';
    return value.split(/(\x1b\[[0-9;]*m)/g).map(part => {
        const code = part.match(/\x1b\[([0-9;]*)m/);
        if (code) {
            const colour = code[1].split(';').find(item => colours[item]);
            active = colour ? colours[colour] : '';
            return '';
        }
        const content = escapeHtml(part);
        return active ? `<span class="${active}">${content}</span>` : content;
    }).join('');
}

function renderTimelineMarkdown(markdown) {
    const lines = markdown.split('\n');
    const output = [];
    let normal = [];
    let ansi = [];
    let inFence = false;

    const flushNormal = () => {
        if (normal.length) output.push(marked.parse(normalizeDiscordMarkdown(normal.join('\n'))));
        normal = [];
    };
    const flushAnsi = () => {
        if (ansi.length) output.push(`<pre class="Project-ansi-block"><code>${ansiToHtml(ansi.join('\n'))}</code></pre>`);
        ansi = [];
    };

    lines.forEach(line => {
        if (line.trim().startsWith('```')) {
            if (inFence) {
                flushAnsi();
                inFence = false;
            } else {
                flushNormal();
                inFence = true;
            }
            return;
        }
        const isAnsi = inFence || /\x1b\[[0-9;]*m/.test(line);
        if (isAnsi) {
            flushNormal();
            ansi.push(line);
        } else {
            flushAnsi();
            normal.push(line);
        }
    });
    flushAnsi();
    flushNormal();
    return output.join('');
}

function carouselMarkup(images) {
    const slides = images.map((image, index) => `<figure class="Project-carousel-slide" data-slide-index="${index}"><img src="${image}" alt="Project image ${index + 1}" loading="lazy"><span class="Project-carousel-more"></span></figure>`).join('');
    return `<section class="Project-gallery" aria-label="Project images">
        <div class="Project-carousel-window"><div class="Project-carousel-track">${slides}</div></div>
        <div class="Project-carousel-controls">
            <button class="Project-carousel-arrow Project-carousel-prev" type="button" aria-label="Previous image" disabled>&lt;</button>
            <span class="Project-carousel-count">1 / ${images.length}</span>
            <button class="Project-carousel-arrow Project-carousel-next" type="button" aria-label="Next image">&gt;</button>
        </div>
    </section>`;
}

function wireCarousel(gallery) {
    if (!gallery) return;
    const track = gallery.querySelector('.Project-carousel-track');
    const slides = [...gallery.querySelectorAll('.Project-carousel-slide')];
    const previous = gallery.querySelector('.Project-carousel-prev');
    const next = gallery.querySelector('.Project-carousel-next');
    const count = gallery.querySelector('.Project-carousel-count');
    const images = slides.map(slide => slide.querySelector('img').src);
    let position = 0;

    const update = () => {
        const visibleCount = window.matchMedia('(max-width: 720px)').matches ? 1 : 3;
        const slidePercent = 100 / visibleCount;
        track.style.transform = `translateX(-${position * slidePercent}%)`;
        slides.forEach((slide, index) => {
            const more = slide.querySelector('.Project-carousel-more');
            const isPreview = visibleCount === 3 && index === position + 2 && index < images.length - 1;
            more.textContent = isPreview ? `+${images.length - index - 1}` : '';
            slide.classList.toggle('is-preview', isPreview);
        });
        previous.disabled = position === 0;
        next.disabled = position >= images.length - visibleCount;
        count.textContent = `${position + 1} / ${images.length}`;
    };

    previous.addEventListener('click', () => { position -= 1; update(); });
    next.addEventListener('click', () => { position += 1; update(); });
    window.addEventListener('resize', update);
    update();
}

function wireCarousels() {
    document.querySelectorAll('.Project-gallery').forEach(wireCarousel);
}

async function renderProject(project) {
    const page = document.getElementById('projectPage');
    const image = project.image || getTemporaryArchiveImage();
    const timeline = await loadTimeline(project);
    const involved = await involvedMarkup(project.involved);
    document.title = `${project.title} - FireBee Projects`;
    page.innerHTML = `
        <a class="Project-page-back" href="index.html">&lt; back to projects</a>
        <header class="Project-page-header">
            <div class="Project-page-image"><img src="${image}" alt="${project.title}"></div>
            <div class="Project-page-heading">
                <div class="Project-page-meta"><span>${project.status}</span><span>${project.updated}</span></div>
                <div class="Project-page-tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
                <h1>${project.title}</h1>
                <p>${project.summary || ''}</p>
                ${project.devChannel ? `<a class="Project-page-discord" href="${project.devChannel}" target="_blank" rel="noopener">Open project development channel &gt;</a>` : ''}
            </div>
        </header>
        <section class="Project-page-involved"><h2>Involved</h2><div class="Project-profiles">${involved}</div></section>
        <section class="Project-timeline"><h2>Timeline</h2>${timelineMarkup(timeline, project)}</section>`;
    wireCarousels();
}

document.addEventListener('DOMContentLoaded', async () => {
    const nav = new NavComponent(getNavSections());
    nav.init();
    const page = document.getElementById('projectPage');
    const projectId = new URLSearchParams(location.search).get('id');
    if (!projectId) {
        page.innerHTML = '<p class="Project-page-error">No project specified.</p>';
        return;
    }
    try {
        await renderProject(await loadProjectFile(projectId));
    } catch (error) {
        page.innerHTML = '<p class="Project-page-error">Project not found.</p>';
    }
});