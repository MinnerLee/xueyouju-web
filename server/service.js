import { apiResponse } from './api.js';
import { PUBLIC_SITE_URL } from '../src/hosting.js';

// The hosted service has no separate website. Old bookmarks return to the main site.
export function serviceResponse(request, env, fetchImpl = fetch) {
  if (new URL(request.url).pathname.startsWith('/api/')) return apiResponse(request, env, fetchImpl);
  return new Response(null, { status: 302, headers: { Location: PUBLIC_SITE_URL, 'Cache-Control': 'no-store' } });
}
