export function parsePageCopy(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let title = '';
    const copy = {};

    for (const line of lines) {
        const titleMatch = line.match(/^#\s+(.+)$/);
        if (titleMatch && !title) {
            title = titleMatch[1].trim();
            continue;
        }

        const entry = line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
        if (!entry) continue;
        if (Object.hasOwn(copy, entry[1])) {
            throw new Error(`Duplicate page copy key "${entry[1]}".`);
        }
        copy[entry[1]] = entry[2].trim();
    }

    if (!title) throw new Error('Page copy is missing its title.');
    if (!Object.keys(copy).length) throw new Error('Page copy contains no text entries.');
    return { title, copy };
}
