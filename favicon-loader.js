const icons = [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-64x64.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
];

icons.forEach(icon => {
    const link = document.createElement('link');
    Object.entries(icon).forEach(([attribute, value]) => link.setAttribute(attribute, value));
    document.head.appendChild(link);
});
