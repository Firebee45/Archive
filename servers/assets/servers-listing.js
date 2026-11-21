import { initSiteNav } from '../../shared/site-nav.js';
import '../../shared/site-nav-element.js';
import { loadServers, rowMarkup } from '../../shared/member-servers.js';

async function init() {
    initSiteNav();

    const list = document.getElementById('serversList');
    if (!list) return;

    const servers = await loadServers('manifest.json');
    list.innerHTML = servers.length
        ? `<div class="member-card"><ul class="member-list">${servers.map(rowMarkup).join('')}</ul></div>`
        : '<p class="Server-empty">No servers listed yet.</p>';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
