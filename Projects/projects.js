import { NavComponent } from '../Landing%20page/assets/components/nav.js';
import { FirebeeNav } from '../Landing%20page/assets/components/ArchiveComponents.js';
import { getNavSections } from '../Landing%20page/assets/config.js';
import { SearchComponent } from '../Archive/assets/js/search-component.js';
import { getTemporaryArchiveImage, loadProjects } from './projects-data.js';

const tagColours = ['#c9a84c', '#ff6a34', '#6da6a1', '#b87545', '#8c9b59'];

function createProjectCard(project, index) {
    const details = project.details.map(detail => `<li>${detail}</li>`).join('');
    const involved = project.involved.map(person => {
        const name = person.profile?.name || person.name || person.discordId || 'Contributor';
        const contribution = person.contribution ? `: ${person.contribution}` : '';
        return `<li>${name}${contribution}</li>`;
    }).join('');
    const ideas = project.ideas.map(idea => `<li>${idea}</li>`).join('');
    const tech = project.tech.map(item => `<span>${item}</span>`).join('');
    const infoSections = [
        project.involved.length ? `<section class="Project-info"><h3>Involved</h3><ul>${involved}</ul></section>` : '',
        project.ideas.length ? `<section class="Project-info"><h3>Core ideas</h3><ul>${ideas}</ul></section>` : '',
        project.details.length ? `<section class="Project-info"><h3>Details</h3><ul>${details}</ul></section>` : ''
    ].filter(Boolean).join('');
    const image = project.image || getTemporaryArchiveImage();
    const tags = project.tags.map((tag, tagIndex) => {
        const colour = tagColours[tagIndex % tagColours.length];
        return `<span class="Project-tag" style="--tag-colour: ${colour}">${tag}</span>`;
    }).join('');

    const statusGroup = getStatusGroup(project.status);
    const projectSlug = project.sourcePath.split('/')[0];
    const projectHref = `project.html?id=${encodeURIComponent(projectSlug)}`;

    return `
        <article class="Project-card${statusGroup === 'abandoned' ? ' Project-card--abandoned' : ''}" data-project-index="${index}" style="--card-index: ${index}">
            <div class="Project-card-topline">
                <span class="Project-number">0${index + 1}</span>
                <span class="Project-status">${project.status}</span>
            </div>
            <div class="Project-visual">
                <img src="${image}" alt="" loading="lazy">
            </div>
            <div class="Project-tags">${tags}</div>
            <div class="Project-card-body">
                <h2>${project.title}</h2>
                <p class="Project-summary">${project.summary}</p>
                ${infoSections ? `<div class="Project-info-grid">${infoSections}</div>` : ''}
            </div>
            <div class="Project-card-footer">
                <div class="Project-tech">${tech}</div>
                <span class="Project-updated">${project.updated}</span>
                <a class="Project-cta" href="${projectHref}" aria-label="Open ${project.title}">&gt;</a>
            </div>
        </article>`;
}

function getStatusGroup(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('abandon')) return 'abandoned';
    if (normalized.includes('hold')) return 'onhold';
    if (normalized.includes('finish') || normalized.includes('inactive') || normalized.includes('complete')) return 'finished';
    return 'active';
}

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    const sections = [
        { key: 'active', label: 'Active' },
        { key: 'onhold', label: 'On hold' },
        { key: 'finished', label: 'Finished / Inactive' },
        { key: 'abandoned', label: 'Abandoned' }
    ];

    grid.innerHTML = sections.map(section => {
        const cards = projects
            .map((project, index) => ({ project, index }))
            .filter(({ project }) => getStatusGroup(project.status) === section.key)
            .map(({ project, index }) => createProjectCard(project, index))
            .join('');

        return `<section class="Project-section Project-section--${section.key}">
            <div class="Project-section-heading">
                <h2>${section.label}</h2>
                <span>${cards ? `${projects.filter(project => getStatusGroup(project.status) === section.key).length} projects` : 'No projects yet'}</span>
            </div>
            <div class="Project-section-grid">${cards}</div>
        </section>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const nav = new NavComponent(getNavSections());
    nav.init();
    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.placeholder = 'Search projects...';
    try {
        const projects = await loadProjects();
        renderProjects(projects);
        new SearchComponent(projects, matches => {
            document.querySelectorAll('.Project-card').forEach(card => {
                card.hidden = !matches[Number(card.dataset.projectIndex)];
            });
        }).init();
    } catch (error) {
        console.error(error);
    }
});
