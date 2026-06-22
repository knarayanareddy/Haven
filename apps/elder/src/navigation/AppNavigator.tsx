import React, { useState, useCallback, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { productionScreens } from '@haven/schema/src/screenSchema';
import { ElderScreen } from '../screens/ElderScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../auth/AuthProvider';

export type ElderStackParamList = Record<string, undefined>;

export function AppNavigator() {
  const { session, isReady } = useAuth();
  const [activeScreenId, setActiveScreenId] = useState('HOME');
  const historyRef = useRef<string[]>(['HOME']);

  const onNavigate = useCallback((screenId: string) => {
    historyRef.current = [...historyRef.current, screenId];
    setActiveScreenId(screenId);
  }, []);

  const onBack = useCallback(() => {
    const history = historyRef.current;
    if (history.length <= 1) return;
    history.pop();
    historyRef.current = history;
    setActiveScreenId(history[history.length - 1]);
  }, []);

  const canGoBack = historyRef.current.length > 1;

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2B4C' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <ElderScreen screenId={activeScreenId} onNavigate={onNavigate} onBack={canGoBack ? onBack : undefined} />;
}
