import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TRAINING_METHODS } from '@/data/methods';

export default function LearnScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('tabs.learn')}</Text>
        <Text style={styles.note}>{t('learn.note')}</Text>
        {TRAINING_METHODS.map((method) => (
          <TouchableOpacity key={method.id} style={styles.card} onPress={() => router.push(`/method/${method.id}` as any)}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{t(method.nameKey)}</Text>
              <Text style={styles.description} numberOfLines={1}>{t(method.descriptionKey)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  note: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: '#F2F3F5' },
  cardContent: { flex: 1, gap: 5 },
  name: { fontSize: 17, fontWeight: '600', color: '#111' },
  description: { fontSize: 13, color: '#666' },
  arrow: { fontSize: 24, color: '#666' },
});
