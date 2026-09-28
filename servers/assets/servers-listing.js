import { NavComponent } from '../../Landing%20page/assets/components/nav.js';
import '../../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../../Landing%20page/assets/config.js';
import { loadServers, rowMarkup } from '../../Landing%20page/assets/member-servers.js';

async function init() {
    new NavComponent(getNavSections()).init();

    const list = document.getElementById('serversList');
    if (!list) return;

    const servers = await loadServers('manifest.json');
    list.innerHTML = servers.length
        ? `<div class="member-card"><ul class="member-list">${servers.map(rowMarkup).join('')}</ul></div>`
        : '<p class="Server-empty">No servers listed yet.</p>';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
