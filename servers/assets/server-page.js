import { NavComponent } from '../../Landing%20page/assets/components/nav.js';
import '../../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../../Landing%20page/assets/config.js';
import { SearchComponent } from '../../Archive/assets/js/search-component.js';
import { YOUTUBE_API_KEY } from './servers-config.js';
import {
    escapeHtml, safeUrl, formatInline, parseServerMarkdown,
    parseBlocks, parseMembers, parseVideos, getMembershipInfo
} from './server-markdown.js';

/* ---------- platform icons for member links ---------- */

const ICONS = {
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.78 2 12 2 12s0 3.22.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.22 22 12 22 12s0-3.22-.4-4.8ZM10 15V9l5.2 3Z"/></svg>',
    twitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M4 2 2.5 6.5V19h5v3h3l3-3h4l5-4V2Zm7 4.5h2v5h-2Zm5 0h2v5h-2Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

function platformFor(url) {
    let host = '';
    try { host = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch (error) { host = ''; }
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return { key: 'youtube', label: 'YouTube' };
    if (host.endsWith('twitch.tv')) return { key: 'twitch', label: 'Twitch' };
    if (host === 'x.com' || host.endsWith('twitter.com')) return { key: 'x', label: 'X' };
    if (host.endsWith('instagram.com')) return { key: 'instagram', label: 'Instagram' };
    return { key: 'link', label: host || 'Link' };
}

/* ---------- small helpers ---------- */

function pageBase() {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    const last = url.pathname.split('/').pop();
    if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(last)) url.pathname += '/';
    return url;
}

function initial(name) {
    return escapeHtml((name || '?').trim().charAt(0).toUpperCase());
}

function avatarMarkup(member, className, fallbackName) {
    const src = member ? safeUrl(member.avatar) : '';
    return src
        ? `<img class="${className}" src="${escapeHtml(src)}" alt="" loading="lazy">`
        : `<span class="${className} ${className}--blank" aria-hidden="true">${initial(member ? member.name : fallbackName)}</span>`;
}

function removeSearch() {
    document.getElementById('archiveSearchEngine')?.remove();
}

/* ---------- header ---------- */

function renderHeader(server) {
    const info = getMembershipInfo(server);
    const icon = safeUrl(server.icon);
    const invite = safeUrl(server.invite);

    const facts = [];
    if (server.version) facts.push(['Version', escapeHtml(server.version), '']);
    if (info.joinedText) facts.push(['Joined', info.joinedText, '']);
    if (info.endedText) facts.push(['Ended', info.endedText, '']);
    else if (info.lengthText) facts.push(['Member for', info.lengthText, 'Counted in UK time (GMT/BST)']);

    return `
        <a class="Server-back" href="../../">Back to home</a>
        <header class="Server-header">
            <div class="Server-icon">
                ${icon
                    ? `<img src="${escapeHtml(icon)}" alt="${escapeHtml(server.title)} icon">`
                    : `<span class="Server-icon-blank" aria-hidden="true">${initial(server.title)}</span>`}
            </div>
            <div class="Server-heading">
                <h1>${escapeHtml(server.title || 'Untitled server')}</h1>
                ${server.description ? `<p class="Server-summary">${formatInline(server.description)}</p>` : ''}
                ${invite ? `<a class="Server-join" href="${escapeHtml(invite)}" target="_blank" rel="noopener noreferrer">Join the Discord</a>` : ''}
            </div>
        </header>
        ${facts.length ? `<dl class="Server-facts">${facts.map(([label, value, tip]) =>
            `<div><dt>${label}</dt><dd${tip ? ` title="${tip}"` : ''}>${value}</dd></div>`).join('')}</dl>` : ''}`;
}

/* ---------- text sections (About + any "Section - Name") ---------- */

function renderBlocks(blocks) {
    return blocks.map(block => {
        if (block.type === 'sub') return `<div class="Server-divider"><span>${formatInline(block.text)}</span></div>`;
        if (block.type === 'paragraph') return `<p>${formatInline(block.text)}</p>`;
        return `<ul class="Server-list">${block.items.map(item => {
            const pair = item.match(/^([^:]{1,40}):\s+(.+)$/);
            return pair
                ? `<li><span class="k">${formatInline(pair[1])}</span><span class="v">${formatInline(pair[2])}</span></li>`
                : `<li><span class="v">${formatInline(item)}</span></li>`;
        }).join('')}</ul>`;
    }).join('');
}

function renderTextSection(section) {
    const blocks = parseBlocks(section.lines);
    if (!blocks.length) return '';
    return `
        <section class="Server-section">
            <div class="Server-section-heading"><h2>${escapeHtml(section.title)}</h2></div>
            <div class="Server-section-body">${renderBlocks(blocks)}</div>
        </section>`;
}

/* ---------- members ---------- */

function renderMembersSection(section, members) {
    if (!members.length) return '';
    const cards = members.map(member => {
        const socials = member.links.map(rawUrl => {
            const url = safeUrl(rawUrl);
            if (!url) return '';
            const platform = platformFor(url);
            return `<a class="Server-social" data-platform="${platform.key}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(member.name)} on ${escapeHtml(platform.label)}" title="${escapeHtml(platform.label)}">${ICONS[platform.key]}</a>`;
        }).join('');
        return `
            <article class="Server-member">
                ${avatarMarkup(member, 'Server-member-avatar')}
                <div class="Server-member-info">
                    <h3>${escapeHtml(member.name)}</h3>
                    ${socials ? `<div class="Server-socials">${socials}</div>` : ''}
                </div>
            </article>`;
    }).join('');

    return `
        <section class="Server-section">
            <div class="Server-section-heading">
                <h2>${escapeHtml(section.title)}</h2>
                <span>${members.length} ${members.length === 1 ? 'member' : 'members'}</span>
            </div>
            <div class="Server-members">${cards}</div>
        </section>`;
}

/* ---------- videos ---------- */

function formatDuration(iso) {
    const match = String(iso || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return '';
    const [days, hours, minutes, seconds] = match.slice(1).map(value => Number(value || 0));
    const totalHours = days * 24 + hours;
    if (!totalHours && !minutes && !seconds) return '';
    const pad = number => String(number).padStart(2, '0');
    return totalHours ? `${totalHours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

async function fetchVideoMeta(ids) {
    const meta = new Map();

    if (YOUTUBE_API_KEY) {
        try {
            for (let i = 0; i < ids.length; i += 50) {
                const chunk = ids.slice(i, i + 50);
                const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${chunk.join(',')}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
                const data = await response.json();
                (data.items || []).forEach(item => meta.set(item.id, {
                    title: item.snippet.title,
                    duration: formatDuration(item.contentDetails.duration),
                    live: item.snippet.liveBroadcastContent === 'live'
                }));
            }
        } catch (error) {
            console.warn('Could not load video details from the YouTube API.', error);
        }
    }

    await Promise.all(ids.filter(id => !meta.has(id)).map(async id => {
        try {
            const target = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
            const response = await fetch(`https://noembed.com/embed?url=${target}`);
            const data = await response.json();
            if (data.title) meta.set(id, { title: data.title, duration: '', live: false });
        } catch (error) {
            /* leave it out; the card falls back to a generic title */
        }
    }));

    return meta;
}

function videoCardMarkup(video, options = {}) {
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
    const badge = video.live
        ? '<span class="Video-duration is-live">LIVE</span>'
        : video.duration ? `<span class="Video-duration">${escapeHtml(video.duration)}</span>` : '';
    const inner = `
        <span class="Video-body">
            <span class="Video-thumb"><img src="${thumb}" alt="" loading="lazy">${badge}</span>
            <span class="Video-title">${escapeHtml(video.title)}</span>
        </span>`;

    if (options.faded) {
        return `<button type="button" class="Video-card Video-card--faded" data-toggle="${escapeHtml(options.key)}" aria-label="Show ${options.more} more videos from ${escapeHtml(video.member)}">${inner}<span class="Video-more-count" aria-hidden="true">+${options.more}</span></button>`;
    }
    return `<a class="Video-card${options.enter ? ' Video-card--enter' : ''}" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

async function setupVideos(section, members) {
    const body = document.getElementById('videosBody');
    if (!body) return;

    const groups = parseVideos(section.lines);
    const ids = [...new Set(groups.flatMap(group => group.videos.map(video => video.id)))];
    if (!ids.length) {
        body.innerHTML = '<p class="Server-empty">No videos added yet.</p>';
        removeSearch();
        return;
    }

    const meta = await fetchVideoMeta(ids);
    const findMember = name => members.find(member => member.name.toLowerCase() === name.toLowerCase());

    groups.forEach(group => {
        group.member = group.member || 'Other';
        group.key = group.member.toLowerCase();
        group.profile = findMember(group.member);
        group.videos.forEach(video => {
            const info = meta.get(video.id) || {};
            video.title = info.title || 'YouTube video';
            video.duration = info.duration || '';
            video.live = Boolean(info.live);
            video.member = group.member;
        });
    });

    const allVideos = groups.flatMap(group => group.videos);
    let visible = new Set(allVideos);
    const expanded = new Set();
    let justExpanded = null;
    let focusKey = null;

    const draw = () => {
        const html = groups.map(group => {
            const list = group.videos.filter(video => visible.has(video));
            if (!list.length) return '';

            const filtering = visible.size !== allVideos.length;
            const collapsible = !filtering && list.length > 3;
            const isExpanded = expanded.has(group.key);
            const shown = collapsible && !isExpanded ? list.slice(0, 3) : list;
            const more = list.length - 2;

            const cards = shown.map((video, index) => {
                if (collapsible && !isExpanded && index === 2) {
                    return videoCardMarkup(video, { faded: true, key: group.key, more });
                }
                return videoCardMarkup(video, { enter: justExpanded === group.key && index >= 3 });
            }).join('');

            const toggle = collapsible
                ? `<button type="button" class="Video-more-btn" data-toggle="${escapeHtml(group.key)}">${isExpanded ? 'Show fewer' : 'See more'}</button>`
                : '';

            return `
                <div class="Videos-group">
                    <div class="Videos-group-head">
                        ${avatarMarkup(group.profile, 'Videos-avatar', group.member)}
                        <h3>${escapeHtml(group.member)}</h3>
                        <span>${list.length} ${list.length === 1 ? 'video' : 'videos'}</span>
                    </div>
                    <div class="Videos-grid">${cards}</div>
                    ${toggle}
                </div>`;
        }).join('');

        body.innerHTML = html || '<p class="Server-empty">No videos match your search.</p>';
        justExpanded = null;

        if (focusKey) {
            [...body.querySelectorAll('.Video-more-btn')].find(button => button.dataset.toggle === focusKey)?.focus();
            focusKey = null;
        }
    };

    body.addEventListener('click', event => {
        const trigger = event.target.closest('[data-toggle]');
        if (!trigger) return;
        const key = trigger.dataset.toggle;
        if (expanded.has(key)) {
            expanded.delete(key);
        } else {
            expanded.add(key);
            justExpanded = key;
        }
        focusKey = key;
        draw();
    });

    draw();

    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.placeholder = 'Search videos or members...';
    const headers = document.querySelectorAll('.filter-panel-header');
    if (headers[1]) headers[1].textContent = 'Filter by member:';

    new SearchComponent(
        allVideos.map(video => ({ title: video.title, description: '', tags: [video.member] })),
        matches => {
            visible = new Set(allVideos.filter((video, index) => matches[index]));
            draw();
        }
    ).init();
}

function renderVideosSection(section) {
    return `
        <section class="Server-section" id="serverVideos">
            <div class="Server-section-heading"><h2>${escapeHtml(section.title)}</h2></div>
            <div id="videosBody"><p class="Server-empty">Loading videos...</p></div>
        </section>`;
}

/* ---------- page ---------- */

async function init() {
    new NavComponent(getNavSections()).init();

    const root = document.getElementById('serverPage');
    if (!root) return;

    const mdUrl = new URL(document.body.dataset.md || 'server.md', pageBase());
    let server;
    try {
        const response = await fetch(mdUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        server = parseServerMarkdown(await response.text());
    } catch (error) {
        console.error(error);
        root.innerHTML = `<a class="Server-back" href="../../">Back to home</a><p class="Server-empty">Could not load this server's data file (${escapeHtml(mdUrl.pathname)}).</p>`;
        removeSearch();
        return;
    }

    document.title = `${server.title || 'Server'} - FireBee`;

    const membersSection = server.sections.find(section => section.kind === 'members');
    const members = membersSection ? parseMembers(membersSection.lines) : [];
    const videosSection = server.sections.find(section => section.kind === 'videos');

    root.innerHTML = renderHeader(server) + server.sections.map(section => {
        if (section.kind === 'members') return renderMembersSection(section, members);
        if (section.kind === 'videos') return section === videosSection ? renderVideosSection(section) : '';
        if (section.kind === 'description') return '';
        return renderTextSection(section);
    }).join('');

    if (videosSection) await setupVideos(videosSection, members);
    else removeSearch();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();