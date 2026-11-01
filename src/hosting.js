export const PUBLIC_SITE_URL = 'https://minnerlee.github.io/xueyouju-web/#chat';
export const HOSTED_API_ORIGIN = 'https://xueyouju-ai-minnerlee.minnerlee233.chatgpt.site';

export function defaultBackendOrigin(location) {
  // Forks and local previews use their own backend, not the maintainer's paid API.
  return location.hostname === 'minnerlee.github.io' && location.pathname.startsWith('/xueyouju-web/')
    ? HOSTED_API_ORIGIN : location.origin;
}
