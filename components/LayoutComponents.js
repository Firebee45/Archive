export class FirebeeNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="brand"><a class="wordmark" href="/" id="brandWordmark"></a></div>
            <nav class="hex-menu" id="hexMenu" aria-label="Site sections">
              <div class="nav-row">
                <button class="hex-toggle" id="hexToggle" aria-label="Menu">
                  <span class="bars"><span></span><span></span><span></span></span>
                </button> 
              </div>
              <div id="petals"></div>
            </nav>
        `;
    }
}

export class FirebeeHero extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="hero">
                <div class="avatar-stage">
                  <div class="avatar-wrap" id="avatarWrap">
                    <img src="Landing%20page/assets/Media/avatar.png" alt="FB Avatar" class="avatar-image" />
                  </div>
                </div>
                <div class="kofi-support" id="kofiSupport"></div>
                <p class="eyebrow" id="heroEyebrow"></p>
                <h1 id="heroTitle"></h1>
                <div class="rule"></div>
                <div class="about-summary" id="aboutSummary"></div>
                <firebee-discord></firebee-discord>
                <div class="socials" id="socials"></div>
            </section>
        `;

        this.renderKofiWidget();
    }

    renderKofiWidget() {
        const container = this.querySelector('#kofiSupport');
        if (!container) return;

        const draw = () => {
            if (!window.kofiwidget2) return;
            kofiwidget2.init('Support me on Ko-fi', '#eb7600', 'B0S7257CGJ');
            container.innerHTML = kofiwidget2.getHTML();
        };

        if (window.kofiwidget2) {
            draw();
        } else {
            // widget script hasn't loaded yet (e.g. slow network) - wait for it
            window.addEventListener('load', draw, { once: true });
        }
    }
}

export class FirebeeDiscord extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<div class="server-groups" id="discordServers"></div>`;
    }
}

export class FirebeeProfile extends HTMLElement {
    connectedCallback() {
        this.className = "about-tag reveal";
        this.innerHTML = `
            <div class="about-tag-content" id="profileCard">
              <p class="tag-title" id="profileTitle"></p>
            </div>
        `;
    }
}

export class FirebeeArchive extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="grid-preview" id="archive">
              <a href="/Archive/" class="card reveal">
                <h3 id="archiveTitle"></h3>
                <p id="archiveDescription"></p>
                <span class="arrow" id="archiveCta"></span>
              </a>
            </section>
        `;
    }
}

customElements.define('firebee-nav', FirebeeNav);
customElements.define('firebee-hero', FirebeeHero);
customElements.define('firebee-discord', FirebeeDiscord);
customElements.define('firebee-profile', FirebeeProfile);
customElements.define('firebee-archive', FirebeeArchive);