/**
 * Streamview CORS Proxy — Cloudflare Worker
 *
 * Deploy options:
 *   A) Cloudflare Dashboard → Workers & Pages → Create → paste this file
 *   B) CLI: npx wrangler deploy
 *
 * Your URL will look like: https://sv-proxy.your-name.workers.dev
 * Add it in the app via the ⚙ Proxy button.
 */

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return new Response('Missing ?url= parameter', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (_) {
      return new Response('Invalid URL', { status: 400 });
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response('Only http/https URLs supported', { status: 400 });
    }

    try {
      const upstream = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Streamview/1.0)',
          'Accept': '*/*',
        },
        redirect: 'follow',
      });

      const headers = new Headers();
      const ct = upstream.headers.get('content-type');
      if (ct) headers.set('content-type', ct);
      const cl = upstream.headers.get('content-length');
      if (cl) headers.set('content-length', cl);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'no-store');

      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (e) {
      return new Response('Proxy error: ' + e.message, { status: 502 });
    }
  },
};
