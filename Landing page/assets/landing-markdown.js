function splitSections(raw) {
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
    return sections;
}

function splitParagraphs(lines) {
    return lines.join('\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

function parseKeyValueList(lines) {
    return lines
        .map(line => line.match(/^-\s+([^:]+):\s*(.+)$/))
        .filter(Boolean)
        .map(match => [match[1].trim(), match[2].trim()]);
}

function parseLine(regex, lines) {
    for (const line of lines) {
        const match = line.match(regex);
        if (match) return match[1].trim();
    }
    return '';
}

function parseDiscordCommunities(lines) {
    const groups = [];
    let current = null;
    lines.forEach(line => {
        const heading = line.match(/^###\s+(.+)$/);
        const item = line.match(/^-\s+\[([^\]]*)\]\(([^)]+)\)\s*\|\s*(.+)$/);
        if (heading) {
            current = { title: heading[1].trim(), servers: [] };
            groups.push(current);
            return;
        }
        if (item && current) {
            current.servers.push({ name: item[1], invite: item[2], icon: item[3].trim() });
        }
    });
    return groups;
}

export function parseLandingMarkdown(raw) {
    const sections = splitSections(raw);

    const heroTitle = parseLine(/^#\s+(.+)$/, sections.header);
    const brandWordmark = parseLine(/^Wordmark:\s*(.+)$/i, sections.header) || heroTitle;
    const heroEyebrow = parseLine(/^Eyebrow:\s*(.+)$/i, sections.header);

    const aboutParagraphs = splitParagraphs(sections.about || []);
    const discordCommunities = parseDiscordCommunities(sections['discord communities'] || []);

    const profileLines = sections.profile || [];
    const profileTitle = parseLine(/^Title:\s*(.+)$/i, profileLines);
    const profileFields = Object.fromEntries(parseKeyValueList(profileLines));

    const archiveLines = sections['archive card'] || [];
    const archiveTitle = parseLine(/^Title:\s*(.+)$/i, archiveLines);
    const archiveCta = parseLine(/^CTA:\s*(.+)$/i, archiveLines);
    const archiveDescription = splitParagraphs(
        archiveLines.filter(line => !/^Title:\s*/i.test(line) && !/^CTA:\s*/i.test(line))
    ).join('\n\n');

    const footerCopy = splitParagraphs(sections.footer || []).join(' ');

    return {
        brandWordmark,
        heroEyebrow,
        heroTitle,
        aboutParagraphs,
        discordCommunities,
        profileTitle,
        profileFields,
        archiveCard: { title: archiveTitle, description: archiveDescription, cta: archiveCta },
        footerCopy
    };
}