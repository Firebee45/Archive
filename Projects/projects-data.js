const archiveImages = [
    '../Archive/assets/media/area_render_100_.png',
    '../Archive/assets/media/area_render_120_.png',
    '../Archive/assets/media/area_render_128_.png',
    '../Archive/assets/media/area_render_135_.png'
];

export function getTemporaryArchiveImage() {
    return archiveImages[Math.floor(Math.random() * archiveImages.length)];
}

export function parseProjectMarkdown(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    const project = { details: [], involved: [], ideas: [], tech: [], tags: [], profiles: {}, todo: [] };
    let section = '';

    lines.forEach(line => {
        const profile = line.match(/^<!--\s*discord-profile:\s*(.+?)\s*-->$/);
        if (profile) {
            try {
                const data = JSON.parse(profile[1]);
                project.profiles[data.id] = data;
            } catch (error) {
            }
            return;
        }
        const heading = line.match(/^##\s+(.+)$/);
        const value = line.match(/^([^:]+):\s*(.+)$/);
        if (heading) {
            section = heading[1].trim().toLowerCase();
        } else if (value && !section) {
            const key = value[1].trim().toLowerCase();
            const content = value[2].trim();
            if (key === 'title') project.title = content;
            if (key === 'image') project.image = content;
            if (key === 'status') project.status = content;
            if (key === 'updated') project.updated = content;
            if (key === 'tags') project.tags = content.split(',').map(tag => tag.trim()).filter(Boolean);
            if (key === 'link') project.href = content;
            if (key === 'dev channel') project.devChannel = content;
            if (key === 'dev channel id') project.devChannelId = content;
            if (key === 'islocal') project.isLocal = content === '1';
        } else if ((section === 'summary' || section === 'description') && line.trim()) {
            project.summary = `${project.summary || ''} ${line.trim()}`.trim();
        } else if (section === 'details' && line.match(/^-\s+/)) {
            project.details.push(line.replace(/^-\s+/, '').trim());
        } else if ((section === 'involved' || section === 'people' || section === 'contributors') && line.match(/^-\s+/)) {
            const entry = line.replace(/^-\s+/, '').trim();
            const discordEntry = entry.match(/^(\d{15,21})(?:\s*:\s*|\s+-\s+)(.+)$/);
            project.involved.push(discordEntry
                ? { discordId: discordEntry[1], contribution: discordEntry[2], profile: project.profiles[discordEntry[1]] }
                : { name: entry, contribution: '' });
        } else if ((section === 'core ideas' || section === 'ideas') && line.match(/^-\s+/)) {
            project.ideas.push(line.replace(/^-\s+/, '').trim());
        } else if (section === 'tech' && line.match(/^-\s+/)) {
            project.tech.push(line.replace(/^-\s+/, '').trim());
        } else if (section === 'todo' && line.match(/^-\s+/)) {
            const todoEntry = line.match(/^-\s+\[( |x)\]\s+(\d+):\s*(.+)$/);
            if (todoEntry) {
                project.todo.push({ id: Number(todoEntry[2]), text: todoEntry[3].trim(), done: todoEntry[1] === 'x' });
            }
        }
    });

    project.todo.sort((a, b) => a.id - b.id);
    project.description = [project.summary, ...project.details, ...project.involved, ...project.ideas, ...project.tags].filter(Boolean).join(' ');
    return project;
}

export async function fetchDiscordProfile(discordId) {
    const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(discordId) >> 22n) % 6}.png`;
    const lookups = [
        async () => {
            const response = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
            if (!response.ok) throw new Error('Lanyard profile unavailable');
            const payload = await response.json();
            return payload.data?.discord_user || payload.data?.user;
        },
        async () => {
            const response = await fetch(`https://discordlookup.mesavirep.xyz/v1/user/${discordId}`);
            if (!response.ok) throw new Error('Discord lookup unavailable');
            const payload = await response.json();
            return payload.user || payload;
        }
    ];

    for (const lookup of lookups) {
        try {
            const user = await lookup();
            if (!user) continue;
            const avatar = user.avatar?.startsWith('http')
                ? user.avatar
                : user.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png?size=128`
                    : defaultAvatar;
            return { name: user.global_name || user.globalName || user.username || discordId, avatar };
        } catch (error) {
            continue;
        }
    }

    return { name: discordId, avatar: defaultAvatar };
}

function projectFolderFromPath(path) {
    return path.slice(0, path.lastIndexOf('/'));
}

export async function loadTimeline(project) {
    const folder = projectFolderFromPath(project.sourcePath);
    try {
        const manifestResponse = await fetch(`listing-data/${folder}/timeline/manifest.json`);
        if (!manifestResponse.ok) return [];
        const dates = await manifestResponse.json();
        const entries = await Promise.all(dates.map(async date => {
            const response = await fetch(`listing-data/${folder}/timeline/${date}`);
            if (!response.ok) return null;
            return { date: date.replace(/\.md$/, ''), markdown: await response.text() };
        }));
        return entries.filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        return [];
    }
}

export async function loadProjectFile(path) {
    const sourcePath = path.includes('/') ? path : `${path}/project.md`;
    const response = await fetch(`listing-data/${sourcePath}`);
    if (!response.ok) throw new Error(`Could not load listing-data/${sourcePath}`);
    const project = parseProjectMarkdown(await response.text());
    project.sourcePath = sourcePath;
    project.projectFolder = projectFolderFromPath(sourcePath);
    project.image = project.image ? new URL(project.image, new URL(`listing-data/${sourcePath}`, location.href)).href : '';
    return project;
}

export async function loadProjects() {
    const manifestResponse = await fetch('listing-data/manifest.json');
    if (!manifestResponse.ok) throw new Error('Could not load the Projects manifest.');
    const projectPaths = await manifestResponse.json();
    const results = await Promise.all(projectPaths.map(async path => {
        try {
            const project = await loadProjectFile(path);
            project.timeline = await loadTimeline(project);
            if (project.timeline[0]) project.updated = project.timeline[0].date;
            return project;
        } catch (error) {
            return null;
        }
    }));
    return results.filter(Boolean);
}