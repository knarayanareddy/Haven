import React, { useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { productionScreens } from '@haven/schema/src/screenSchema';
import { ElderScreen } from '../screens/ElderScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../auth/AuthProvider';

export type ElderStackParamList = Record<string, undefined>;

export function AppNavigator() {
  const { session, isReady } = useAuth();
  const [activeScreenId, setActiveScreenId] = useState('HOME');

  const onNavigate = useCallback((screenId: string) => {
    setActiveScreenId(screenId);
  }, []);

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

  return <ElderScreen screenId={activeScreenId} onNavigate={onNavigate} />;
}
