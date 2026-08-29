export const config = {
  nav: {sections: [{label: 'Home', href: '/'}, {label: 'Archive', href: '/Archive/'}]},
  socials: {links: [{label: 'Discord', href: 'https://discord.gg/VcHtH8Brxs'}, {label: 'YouTube', href: 'https://youtube.com/@firebee./'}, {label: 'Instagram', href: 'https://www.instagram.com/firebee_photography'}]},
  animations: {scrollRevealThreshold: 0.15}
};

function isActive(href, path) {
  if (href === '/') return path === '/' || path.endsWith('/index.html');
  return path.toLowerCase().startsWith(href.toLowerCase());
}

export function getNavSections() {
  const path = window.location.pathname;
  return config.nav.sections.map(section => ({ ...section, active: isActive(section.href, path) }));
}