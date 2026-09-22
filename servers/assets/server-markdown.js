/* Shared by the landing page (cards) and the server pages (full details). */

const CUSTOM_PREFIX = /^section\s*[-–—:]\s*/i;

const HEADER_KEYS = {
    title: 'title',
    name: 'title',
    icon: 'icon',
    invite: 'invite',
    'invite link': 'invite',
    version: 'version',
    joined: 'joined',
    'join date': 'joined',
    ended: 'ended',
    end: 'ended',
    'end date': 'ended',
    left: 'ended',
    'leave date': 'ended'
};

/* ---------- text helpers ---------- */

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

export function safeUrl(url) {
    const value = String(url || '').trim();
    return /^https?:\/\//i.test(value) ? value : '';
}

export function formatInline(text) {
    return escapeHtml(text)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
}

function titleCase(text) {
    return text.trim().replace(/(^|\s)([a-z])/g, (match, space, char) => space + char.toUpperCase());
}

/* ---------- section parsing ---------- */

function makeSection(rawName) {
    const name = rawName.trim();
    if (CUSTOM_PREFIX.test(name)) {
        return { kind: 'custom', title: titleCase(name.replace(CUSTOM_PREFIX, '')), lines: [] };
    }
    const key = name.toLowerCase();
    if (key === 'description') return { kind: 'description', title: 'Description', lines: [] };
    if (key === 'long description' || key === 'about') return { kind: 'about', title: 'About', lines: [] };
    if (key === 'members') return { kind: 'members', title: 'Members', lines: [] };
    if (key === 'videos') return { kind: 'videos', title: 'Videos', lines: [] };
    console.warn(`Server markdown: ignored "## ${name}". Custom sections must be written as "## Section - ${name}".`);
    return null;
}

export function parseServerMarkdown(raw) {
    const server = { title: '', icon: '', invite: '', version: '', joined: '', ended: '', description: '', sections: [] };
    let current = null;
    let skipping = false;

    raw.replace(/\r\n/g, '\n').split('\n').forEach(line => {
        const heading = line.match(/^(#{1,2})\s+(.+?)\s*$/);
        if (heading) {
            const isSectionHeading = heading[1] === '##' || CUSTOM_PREFIX.test(heading[2]);
            if (isSectionHeading) {
                current = makeSection(heading[2]);
                skipping = !current;
                if (current) server.sections.push(current);
                return;
            }
            if (!server.title) server.title = heading[2].trim();
            return;
        }

        if (current || skipping) {
            if (current) current.lines.push(line);
            return;
        }

        const pair = line.match(/^([A-Za-z ]+):\s*(.*)$/);
        if (pair) {
            const field = HEADER_KEYS[pair[1].trim().toLowerCase()];
            if (field) server[field] = pair[2].trim();
        }
    });

    const description = server.sections.find(section => section.kind === 'description');
    if (description) {
        server.description = description.lines.map(line => line.trim()).filter(Boolean).join(' ');
    }
    return server;
}

/* Turns section lines into blocks: sub-headings (###), paragraphs and bullet lists. */
export function parseBlocks(lines) {
    const blocks = [];
    let paragraph = [];
    let list = null;

    const flushParagraph = () => {
        if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
        paragraph = [];
    };
    const flushList = () => {
        if (list) blocks.push({ type: 'list', items: list });
        list = null;
    };

    lines.forEach(line => {
        const text = line.trim();
        if (!text) { flushParagraph(); return; }

        const sub = text.match(/^###\s+(.+)$/);
        if (sub) { flushParagraph(); flushList(); blocks.push({ type: 'sub', text: sub[1].trim() }); return; }

        const bullet = text.match(/^[-*]\s+(.+)$/);
        if (bullet) { flushParagraph(); list = list || []; list.push(bullet[1].trim()); return; }

        flushList();
        paragraph.push(text);
    });

    flushParagraph();
    flushList();
    return blocks;
}

/* "- Name | pfp url | link | link ..."  (pfp can be left empty) */
export function parseMembers(lines) {
    return lines
        .map(line => line.trim().match(/^[-*]\s+(.+)$/))
        .filter(Boolean)
        .map(match => {
            const [name, avatar = '', ...links] = match[1].split('|').map(part => part.trim());
            return { name, avatar, links: links.filter(Boolean) };
        })
        .filter(member => member.name);
}

export function extractYouTubeId(input) {
    const value = String(input || '').trim();
    if (/^[\w-]{11}$/.test(value)) return value;
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '').toLowerCase();
        if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
        if (host.endsWith('youtube.com')) {
            const id = url.searchParams.get('v');
            if (id) return id;
            const match = url.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})/);
            if (match) return match[1];
        }
    } catch (error) {
        return null;
    }
    return null;
}

/* "### Member name" followed by "- youtube link" lines, newest first. */
export function parseVideos(lines) {
    const groups = [];
    let current = null;

    lines.forEach(line => {
        const text = line.trim();
        const member = text.match(/^###\s+(.+)$/);
        if (member) {
            current = { member: member[1].trim(), videos: [] };
            groups.push(current);
            return;
        }
        const bullet = text.match(/^[-*]\s+(.+)$/);
        if (!bullet) return;
        const id = extractYouTubeId(bullet[1].split('|')[0]);
        if (!id) return;
        if (!current) { current = { member: '', videos: [] }; groups.push(current); }
        current.videos.push({ id, url: `https://www.youtube.com/watch?v=${id}` });
    });

    return groups;
}

/* ---------- dates (all worked out in UK time, so GMT/BST is handled) ---------- */

export function parseDateParts(text) {
    const value = String(text || '').trim();
    let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
    match = value.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
    if (match) return { y: Number(match[3]), m: Number(match[2]), d: Number(match[1]) };
    return null;
}

export function londonToday() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(new Date());
    const read = type => Number(parts.find(part => part.type === type).value);
    return { y: read('year'), m: read('month'), d: read('day') };
}

export function formatDate({ y, m, d }) {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    });
}

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/* "1 year, 2 months, 3 days" - only the parts that are not zero. */
export function membershipLength(from, to = londonToday()) {
    let totalMonths = (to.y - from.y) * 12 + (to.m - from.m);
    if (to.d < from.d) totalMonths -= 1;
    if (totalMonths < 0) return '';

    const index = (from.m - 1) + totalMonths;
    const anchorYear = from.y + Math.floor(index / 12);
    const anchorMonth = (index % 12) + 1;
    const anchorDay = Math.min(from.d, daysInMonth(anchorYear, anchorMonth));
    const days = Math.round((Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(anchorYear, anchorMonth - 1, anchorDay)) / 86400000);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const parts = [];
    if (years) parts.push(plural(years, 'year'));
    if (months) parts.push(plural(months, 'month'));
    if (days) parts.push(plural(days, 'day'));
    return parts.length ? parts.join(', ') : 'less than a day';
}

export function getMembershipInfo(server) {
    const joined = parseDateParts(server.joined);
    const ended = parseDateParts(server.ended);
    return {
        active: !ended,
        joinedText: joined ? formatDate(joined) : '',
        endedText: ended ? formatDate(ended) : '',
        lengthText: joined && !ended ? membershipLength(joined) : ''
    };
}