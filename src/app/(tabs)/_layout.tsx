import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="nutrition" options={{ title: t('nutrition.title') }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.learn') }} />
    </Tabs>
  );
}
