import { config, getNavSections } from './config.js';
import { NavComponent, SocialsComponent, AnimationComponent, CanvasComponent } from './components/index.js';
import { FirebeeNav, FirebeeHero, FirebeeDiscord, FirebeeProfile, FirebeeArchive } from './components/LayoutComponents.js';
import { parseLandingMarkdown } from './landing-markdown.js';

function formatFancyText(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="fancy-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('hexMenu')) {
        const nav = new NavComponent(getNavSections());
        nav.init();
    }
    
    const socials = new SocialsComponent(config.socials.links);
    socials.init();
    
    const animations = new AnimationComponent(config.animations.scrollRevealThreshold);
    animations.init();
    
    const canvas = new CanvasComponent();
    canvas.init();

    try {
        const mdResponse = await fetch('Landing%20page/assets/data/landing.md');
        if (!mdResponse.ok) throw new Error();

        const mdText = await mdResponse.text();
        const data = parseLandingMarkdown(mdText);
        if (!data) return;

        const brandElement = document.getElementById('brandWordmark');
        if (brandElement && data.brandWordmark) brandElement.innerHTML = formatFancyText(data.brandWordmark);
        
        if (data.heroEyebrow) document.getElementById('heroEyebrow').innerHTML = formatFancyText(data.heroEyebrow);
        if (data.heroTitle) document.getElementById('heroTitle').innerHTML = formatFancyText(data.heroTitle);
        
        const aboutSummary = document.getElementById('aboutSummary');
        if (aboutSummary && data.aboutParagraphs) {
            aboutSummary.innerHTML = '';
            data.aboutParagraphs.forEach((paragraphText, idx, array) => {
                const p = document.createElement('p');
                p.className = 'about';
                if (idx === array.length - 1) p.classList.add('text-dim'); 
                p.innerHTML = formatFancyText(paragraphText);
                aboutSummary.appendChild(p);
            });
        }

        if (data.profileTitle) document.getElementById('profileTitle').innerHTML = formatFancyText(data.profileTitle);
        const profileCard = document.getElementById('profileCard');
        if (profileCard && data.profileFields) {
            Object.entries(data.profileFields).forEach(([key, value]) => {
                const row = document.createElement('div');
                row.className = 'tag-row';
                row.innerHTML = `<span class="k">${key}</span><span class="v">${formatFancyText(value)}</span>`;
                profileCard.appendChild(row);
            });
        }

        if (data.archiveCard) {
            if (data.archiveCard.title) document.getElementById('archiveTitle').innerHTML = formatFancyText(data.archiveCard.title);
            if (data.archiveCard.description) document.getElementById('archiveDescription').innerHTML = formatFancyText(data.archiveCard.description);
            if (data.archiveCard.cta) document.getElementById('archiveCta').innerHTML = formatFancyText(data.archiveCard.cta);
        }

        const serverGroupsContainer = document.getElementById('discordServers');
        if (serverGroupsContainer && data.discordCommunities) {
            const fragments = data.discordCommunities.map(group => {
                const section = document.createElement('div');
                section.className = 'server-section';
                
                const title = document.createElement('div');
                title.className = 'section-title';
                title.innerHTML = formatFancyText(group.title);
                section.appendChild(title);
                
                group.servers.forEach(server => {
                    const card = document.createElement('div');
                    card.className = 'server-card';
                    card.innerHTML = `
                        <img src="${server.icon}" alt="${server.name} Icon" class="server-icon" loading="lazy">
                        <div class="server-info">
                            <p class="server-name">${formatFancyText(server.name)}</p>
                        </div>
                        <a href="${server.invite}" target="_blank" rel="noopener noreferrer" class="join-btn">Join</a>
                    `;
                    section.appendChild(card);
                });
                return section;
            });

            serverGroupsContainer.innerHTML = '';
            serverGroupsContainer.append(...fragments);
        }

        if (data.footerCopy) document.getElementById('footerCopy').innerHTML = formatFancyText(data.footerCopy);

    } catch (error) {
        console.error(error);
    }
});