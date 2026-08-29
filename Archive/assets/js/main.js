import { fetchArchiveData } from './archive-service.js';
import { renderArchiveGrid, refreshArchiveLayout } from './archive-ui.js';
import { NavComponent } from '../../../Landing%20page/assets/components/nav.js';
import { SearchComponent } from './search-component.js'; 
import { FirebeeNav, FirebeeArchiveShowcase } from '../../../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../../../Landing%20page/assets/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const nav = new NavComponent(getNavSections());
    nav.init();
    const showcaseContainer = document.querySelector('.Archive-showcase');
    if (!showcaseContainer) return;
    const dataPayload = await fetchArchiveData();
    renderArchiveGrid(showcaseContainer, dataPayload);
    const archiveCards = dataPayload.cards || [];

    const searchEngine = new SearchComponent(
        archiveCards, 
        (matchStates) => {
            const domCards = showcaseContainer.querySelectorAll('.Archive-card[data-index]');
            domCards.forEach((card) => {
                const idx = Number(card.dataset.index);
                if (matchStates[idx]) {
                    card.classList.remove('is-hidden');
                } else {
                    card.classList.add('is-hidden');
                }
            });
            refreshArchiveLayout(showcaseContainer);
        },
        '#archiveSearchEngine'
    );
    searchEngine.init();
});