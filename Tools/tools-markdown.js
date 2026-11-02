function parseFields(lines) {
    return Object.fromEntries(lines
        .map(line => line.match(/^([A-Za-z ]+):\s*(.*)$/))
        .filter(Boolean)
        .map(match => [match[1].trim().toLowerCase(), match[2].trim()]));
}

export function parseToolsMarkdown(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    const pageLines = [];
    const tools = [];
    let currentTool = null;
    let inToolsSection = false;
    let title = '';

    for (const line of lines) {
        const pageTitle = line.match(/^#\s+(.+)$/);
        const section = line.match(/^##\s+(.+)$/);
        const toolHeading = line.match(/^###\s+(.+)$/);

        if (pageTitle && !title) {
            title = pageTitle[1].trim();
        } else if (section) {
            inToolsSection = section[1].trim().toLowerCase() === 'available tools';
            currentTool = null;
        } else if (toolHeading && inToolsSection) {
            currentTool = { title: toolHeading[1].trim(), lines: [] };
            tools.push(currentTool);
        } else if (currentTool) {
            currentTool.lines.push(line);
        } else if (!inToolsSection) {
            pageLines.push(line);
        }
    }

    const pageFields = parseFields(pageLines);
    const toolsSection = lines
        .map(line => line.match(/^##\s+(.+)$/))
        .find(match => match && match[1].trim().toLowerCase() === 'available tools');
    const parsedTools = tools.map(tool => ({
        title: tool.title,
        ...parseFields(tool.lines)
    }));

    if (!title || !pageFields['page title'] || !pageFields.eyebrow || !pageFields.intro || !toolsSection) {
        throw new Error('Tools markdown is missing required page content.');
    }
    if (!parsedTools.length || parsedTools.some(tool =>
        !tool.title || !tool.category || !tool.description || !tool.link || !tool.cta
    )) {
        throw new Error('Tools markdown contains an incomplete tool entry.');
    }

    return {
        pageTitle: pageFields['page title'],
        title,
        eyebrow: pageFields.eyebrow,
        intro: pageFields.intro,
        toolsLabel: toolsSection[1].trim(),
        tools: parsedTools
    };
}
