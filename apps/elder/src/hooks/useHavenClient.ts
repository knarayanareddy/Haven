import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { HavenClient } from '../services/havenClient';

export function useHavenClient(): HavenClient | null {
  const { session } = useAuth();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  return useMemo(() => {
    if (!session || !supabaseUrl) return null;
    return new HavenClient({ supabaseUrl, accessToken: session.access_token });
  }, [session?.access_token, supabaseUrl]);
}
