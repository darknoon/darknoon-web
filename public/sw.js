// Retire Gatsby's existing /sw.js registration when this static site is deployed.
// New visitors do not register a service worker.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('gatsby-plugin-offline')).map(name => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map(window => window.navigate(window.url)));
  })());
});
