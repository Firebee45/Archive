import { NavComponent } from '../Landing%20page/assets/components/nav.js';
import { FirebeeNav } from '../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../Landing%20page/assets/config.js';
import { escapeHtml, formatInline } from '../servers/assets/server-markdown.js';
import { parseToolsMarkdown } from './tools-markdown.js';

document.addEventListener('DOMContentLoaded', () => {
    const nav = new NavComponent(getNavSections());
    nav.init();

    loadTools().catch(error => {
        console.error('Unable to load tools page content:', error);
        const status = document.getElementById('toolsStatus');
        status.textContent = 'Tools content could not be loaded.';
    });
});

async function loadTools() {
    const response = await fetch(new URL('tools.md', import.meta.url));
    if (!response.ok) {
        throw new Error(`Failed to load tools.md: ${response.status} ${response.statusText}`);
    }

    const content = parseToolsMarkdown(await response.text());
    const tools = content.tools.map(tool => {
        const url = new URL(tool.link, window.location.href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(`Invalid link for tool "${tool.title}".`);
        }
        return { ...tool, link: url.href };
    });

    document.title = content.pageTitle;
    document.getElementById('toolsEyebrow').textContent = content.eyebrow;
    document.getElementById('toolsTitle').innerHTML = formatInline(content.title);
    document.getElementById('toolsIntro').textContent = content.intro;

    const grid = document.getElementById('toolsGrid');
    grid.setAttribute('aria-label', content.toolsLabel);
    grid.innerHTML = tools.map(tool => `
        <article class="Tool-card">
            <div class="Tool-card-content">
                <p class="Tool-category">${formatInline(tool.category)}</p>
                <h2>${formatInline(tool.title)}</h2>
                <p>${formatInline(tool.description)}</p>
                <a class="Tool-cta" href="${escapeHtml(tool.link)}">${escapeHtml(tool.cta)} <span aria-hidden="true">&rarr;</span></a>
            </div>
        </article>
    `).join('');
    document.getElementById('toolsStatus').remove();
}
