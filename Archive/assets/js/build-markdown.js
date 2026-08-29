function parseListItems(lines) {
    return lines
        .map(line => line.match(/^-\s+(.*)$/))
        .filter(Boolean)
        .map(match => match[1].trim());
}

function parseImages(lines) {
    const text = lines.join('\n');
    return [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1]);
}

function parseLink(text) {
    const match = text.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
    return match ? { name: match[1], path: match[2] } : { name: text, path: text };
}

function splitNameNote(text) {
    const index = text.indexOf(':');
    return index === -1
        ? { name: text.trim(), note: '' }
        : { name: text.slice(0, index).trim(), note: text.slice(index + 1).trim() };
}

export function toPlainText(markdown) {
    return String(markdown || '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/[*_`#>]/g, '')
        .replace(/\r?\n+/g, ' ')
        .trim();
}

export function parseBuildMarkdown(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    const sections = { header: [] };
    let current = 'header';

    lines.forEach(line => {
        const heading = line.match(/^##\s+(.+)$/);
        if (heading) {
            current = heading[1].trim().toLowerCase();
            sections[current] = [];
            return;
        }
        sections[current].push(line);
    });

    let title = '';
    let image = '';
    let version = '';
    let tags = [];
    const descriptionLines = [];

    sections.header.forEach(line => {
        const titleMatch = line.match(/^#\s+(.+)$/);
        const imageMatch = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
        const versionMatch = line.match(/^Version:\s*(.+)$/i);
        const tagsMatch = line.match(/^Tags:\s*(.+)$/i);

        if (titleMatch) title = titleMatch[1].trim();
        else if (imageMatch && !image) image = imageMatch[1];
        else if (versionMatch) version = versionMatch[1].trim();
        else if (tagsMatch) tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(Boolean);
        else descriptionLines.push(line);
    });

    return {
        title,
        image,
        version,
        tags,
        description: descriptionLines.join('\n').trim(),
        features: parseListItems(sections.features || []),
        downsides: parseListItems(sections.downsides || []),
        info: (sections.info || []).join('\n').trim(),
        notes: (sections.notes || []).join('\n').trim(),
        credits: parseListItems(sections.credits || []).map(splitNameNote),
        gallery: parseImages(sections.gallery || []),
        downloads: parseListItems(sections.downloads || []).map(parseLink)
    };
}

export function parseTagColours(raw) {
    const colours = {};
    raw.replace(/\r\n/g, '\n').split('\n').forEach(line => {
        const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
        if (match) colours[match[1].trim()] = match[2].trim();
    });
    return colours;
}