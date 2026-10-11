import { useSyncExternalStore } from 'react';

/**
 * Minimal two-route switch between the public homepage and the authenticated app.
 *
 *   /          → public homepage
 *   /#/app     → application (role dashboards, timeline, etc.)
 *
 * The app route lives in the hash so a refresh never depends on server-side SPA
 * fallbacks, and so it does not collide with the OAuth callback (`#access_token=…`),
 * which is handled by the existing auth context.
 */
export type AppRoute = 'home' | 'app';

const APP_HASH = '#/app';

// Views always open at the top (see AppShell). The browser's own restoration would otherwise
// re-apply a stale position after a back/forward navigation, once our reset has already run.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
const listeners = new Set<() => void>();

const readRoute = (): AppRoute =>
  typeof window !== 'undefined' && window.location.hash.startsWith(APP_HASH) ? 'app' : 'home';

const notify = () => listeners.forEach(l => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  window.addEventListener('hashchange', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
    window.removeEventListener('hashchange', listener);
  };
};

export const getRoute = readRoute;

/**
 * Checks whether the current URL contains an active OAuth callback hash or search parameters
 * (e.g. #access_token=..., #error=..., ?code=..., ?error=...).
 * Callback parameters must NEVER be cleared before the auth library finishes processing.
 */
export function isOAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('error=') ||
    hash.includes('error_description=') ||
    search.includes('code=') ||
    search.includes('error=')
  );
}

export function navigateTo(route: AppRoute) {
  if (typeof window === 'undefined') return;
  // Never prematurely wipe OAuth callback parameters if navigating to 'home'
  if (route === 'home' && isOAuthCallback()) {
    return;
  }
  const { pathname, search } = window.location;
  const targetHash = route === 'app' ? APP_HASH : '';
  if (window.location.hash !== targetHash) {
    window.history.pushState(null, '', pathname + search + targetHash);
    notify();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function replaceRoute(route: AppRoute) {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  // Clean any OAuth code / error search params when finalizing route
  const cleanSearch = search.includes('code=') || search.includes('error=') ? '' : search;
  const targetHash = route === 'app' ? APP_HASH : '';
  window.history.replaceState(null, '', pathname + cleanSearch + targetHash);
  notify();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export const useRoute = (): AppRoute => useSyncExternalStore(subscribe, readRoute, () => 'home');
