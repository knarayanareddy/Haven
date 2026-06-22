import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CarerClient } from '../services/havenClient';

export function useCarerClient(): CarerClient | null {
  const { session } = useAuth();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  return useMemo(() => {
    if (!session || !supabaseUrl) return null;
    return new CarerClient({ supabaseUrl, accessToken: session.access_token });
  }, [session?.access_token, supabaseUrl]);
}
