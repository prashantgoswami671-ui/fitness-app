import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TRAINING_METHODS } from '@/data/methods';

export default function MethodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const method = TRAINING_METHODS.find((item) => item.id === id);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>{t('common.back')}</Text></TouchableOpacity>
        {method ? <><Text style={styles.title}>{t(method.nameKey)}</Text><Text style={styles.description}>{t(method.descriptionKey)}</Text></> : <Text style={styles.description}>{t('learn.methodNotFound')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 16 },
  back: { fontSize: 16, color: '#4C9AFF' },
  title: { fontSize: 28, fontWeight: '700' },
  description: { fontSize: 16, lineHeight: 24, color: '#555' },
});
