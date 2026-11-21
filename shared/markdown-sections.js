export function splitMarkdownSections(raw) {
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
