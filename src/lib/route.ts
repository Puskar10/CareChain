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

export function navigateTo(route: AppRoute) {
  if (readRoute() !== route) {
    const { pathname, search } = window.location;
    window.history.pushState(null, '', pathname + search + (route === 'app' ? APP_HASH : ''));
    notify();
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export const useRoute = (): AppRoute => useSyncExternalStore(subscribe, readRoute, () => 'home');
