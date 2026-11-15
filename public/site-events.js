// Integration hook only. No trackers, cookies, form values or referrer paths are collected here.
document.addEventListener('click', event => {
  const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!anchor) return;
  const url = new URL(anchor.href, location.href);
  if (url.hostname === 'www.instagram.com' && url.pathname === '/altweb.design/') {
    document.dispatchEvent(new CustomEvent('altweb:engagement', { detail: { name: 'contact_channel_opened', channel: 'instagram' } }));
  }
});
