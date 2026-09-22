import { parseServerMarkdown, getMembershipInfo, escapeHtml, safeUrl, formatInline } from '../../servers/assets/server-markdown.js';

const MANIFEST_URL = 'servers/manifest.json';

async function loadServers() {
    const manifestUrl = new URL(MANIFEST_URL, document.baseURI);
    const response = await fetch(manifestUrl);
    if (!response.ok) return [];

    const paths = await response.json();
    const servers = await Promise.all(paths.map(async path => {
        try {
            const mdUrl = new URL(path, manifestUrl);
            const mdResponse = await fetch(mdUrl);
            if (!mdResponse.ok) throw new Error(`HTTP ${mdResponse.status}`);
            const server = parseServerMarkdown(await mdResponse.text());
            server.pageUrl = new URL('./', mdUrl).href;
            return server;
        } catch (error) {
            console.warn(`Could not load server file "${path}".`, error);
            return null;
        }
    }));
    return servers.filter(Boolean);
}

function rowMarkup(server) {
    const info = getMembershipInfo(server);
    const name = escapeHtml(server.title || 'Untitled server');
    const icon = safeUrl(server.icon);
    const invite = safeUrl(server.invite);

    const dates = [];
    if (info.joinedText) dates.push(`<span><b>Joined</b> ${info.joinedText}</span>`);
    if (info.endedText) dates.push(`<span><b>Ended</b> ${info.endedText}</span>`);
    else if (info.lengthText) dates.push(`<span class="is-active" title="Counted in UK time (GMT/BST)"><b>Member for</b> ${info.lengthText}</span>`);

    return `
        <li class="member-row${info.active ? '' : ' member-row--ended'}">
            ${icon
                ? `<img class="member-icon" src="${escapeHtml(icon)}" alt="${name} icon" loading="lazy">`
                : `<span class="member-icon member-icon--blank" aria-hidden="true">${escapeHtml((server.title || '?').charAt(0).toUpperCase())}</span>`}
            <div class="member-info">
                <div class="member-head">
                    <h4 class="member-name">${name}</h4>
                    ${server.version ? `<span class="member-version">${escapeHtml(server.version)}</span>` : ''}
                </div>
                ${server.description ? `<p class="member-desc">${formatInline(server.description)}</p>` : ''}
                ${dates.length ? `<div class="member-dates">${dates.join('')}</div>` : ''}
            </div>
            <div class="member-actions">
                ${invite ? `<a href="${escapeHtml(invite)}" target="_blank" rel="noopener noreferrer" class="join-btn">Join</a>` : ''}
                <a href="${escapeHtml(server.pageUrl)}" class="member-more-btn">See more</a>
            </div>
        </li>`;
}

export async function renderMemberServers() {
    const anchor = document.getElementById('discordServers');
    if (!anchor) return;

    const servers = await loadServers();
    if (!servers.length) return;

    const block = document.createElement('div');
    block.className = 'member-of';
    block.innerHTML = `
        <div class="section-title">Member of</div>
        <div class="member-card"><ul class="member-list">${servers.map(rowMarkup).join('')}</ul></div>`;
    anchor.insertAdjacentElement('afterend', block);
}