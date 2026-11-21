import { fetchArchiveData } from './archive-service.js';
import { renderArchiveGrid, refreshArchiveLayout } from './archive-ui.js';
import { initSiteNav } from '../../../shared/site-nav.js';
import { SearchComponent } from '../../../shared/search-component.js';
import '../../../shared/site-nav-element.js';
import { FirebeeArchiveShowcase } from '../../../shared/archive-components.js';

document.addEventListener('DOMContentLoaded', async () => {
    initSiteNav();
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