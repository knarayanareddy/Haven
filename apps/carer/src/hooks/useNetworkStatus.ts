import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Lightweight online/offline detection without external dependencies.
 * Pings the Supabase health endpoint on mount and whenever the app
 * comes back to the foreground.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!url) { if (mounted) setIsOnline(false); return; }
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${url}/rest/v1/`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '' },
        });
        clearTimeout(timer);
        if (mounted) setIsOnline(res.ok || res.status === 401);
      } catch {
        if (mounted) setIsOnline(false);
      }
    }

    check();

    const interval = setInterval(check, 30_000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return isOnline;
}
