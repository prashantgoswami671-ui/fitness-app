import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface GuideData {
  primary: string;
  secondary: string;
  steps: string[];
  mistakes: string[];
  tip: string;
}

const GUIDE_KEYS: Record<string, string> = {
  incline_db_press: 'guide.incline_db_press',
  flat_bb_bench: 'guide.flat_bb_bench',
  cable_lateral_raise: 'guide.cable_lateral_raise',
  overhead_triceps_ext: 'guide.overhead_triceps_ext',
  pushups: 'guide.pushups',
  lat_pulldown: 'guide.lat_pulldown',
  chest_supported_row: 'guide.chest_supported_row',
  incline_db_curl: 'guide.incline_db_curl',
  face_pull: 'guide.face_pull',
  barbell_curl: 'guide.barbell_curl',
  squat: 'guide.squat',
  romanian_deadlift: 'guide.romanian_deadlift',
  leg_press: 'guide.leg_press',
  seated_leg_curl: 'guide.seated_leg_curl',
  standing_calf_raise: 'guide.standing_calf_raise',
  seated_cable_row: 'guide.seated_cable_row',
  dumbbell_curl: 'guide.dumbbell_curl',
  leg_curl: 'guide.leg_curl',
  calf_raise: 'guide.calf_raise',
};

export default function GuideScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const guideKey = id ? GUIDE_KEYS[id] : undefined;

  useEffect(() => {
    if (!id) return;

    const guideKey = GUIDE_KEYS[id];
    if (!guideKey) return;

    const exerciseNameKey = `exercises.${id}.name`;
    const name = t(exerciseNameKey);
    setExerciseName(name);

    const guideData: GuideData = {
      primary: t(`${guideKey}.primary`),
      secondary: t(`${guideKey}.secondary`),
      steps: [
        t(`${guideKey}.steps.0`),
        t(`${guideKey}.steps.1`),
        t(`${guideKey}.steps.2`),
        t(`${guideKey}.steps.3`),
        t(`${guideKey}.steps.4`),
      ].filter(Boolean),
      mistakes: [
        t(`${guideKey}.mistakes.0`),
        t(`${guideKey}.mistakes.1`),
        t(`${guideKey}.mistakes.2`),
      ].filter(Boolean),
      tip: t(`${guideKey}.tip`),
    };
    setGuide(guideData);
  }, [id, t]);

  if (!id) {
    return <SafeAreaView style={s.screen} />;
  }

  if (!guideKey) {
    return (
      <SafeAreaView style={s.screen}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>{t('guide.back')}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('guide.title', { name: t(`exercises.${id}.name`) })}</Text>
          <Text style={s.comingSoon}>{t('guide.comingSoon')}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!guide) {
    return <SafeAreaView style={s.screen} />;
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>{t('guide.back')}</Text>
        </TouchableOpacity>

        <Text style={s.title}>{t('guide.title', { name: exerciseName })}</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('guide.targetMuscles')}</Text>
          <View style={s.muscleRow}>
            <View style={s.muscleColumn}>
              <Text style={s.muscleLabel}>{t('guide.primary')}</Text>
              <Text style={s.muscleValue}>{guide.primary}</Text>
            </View>
            <View style={s.muscleColumn}>
              <Text style={s.muscleLabel}>{t('guide.secondary')}</Text>
              <Text style={s.muscleValue}>{guide.secondary}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('guide.steps')}</Text>
          {guide.steps.map((step, index) => (
            <View key={index} style={s.stepItem}>
              <Text style={s.stepNumber}>{index + 1}.</Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('guide.mistakes')}</Text>
          {guide.mistakes.map((mistake, index) => (
            <View key={index} style={s.mistakeItem}>
              <Text style={s.mistakeBullet}>✗</Text>
              <Text style={s.mistakeText}>{mistake}</Text>
            </View>
          ))}
        </View>

        <View style={s.tipSection}>
          <Text style={s.tipLabel}>{t('guide.tip')}</Text>
          <Text style={s.tipText}>{guide.tip}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#4C9AFF' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  comingSoon: { fontSize: 16, color: '#666', lineHeight: 24 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, color: '#333' },
  muscleRow: { flexDirection: 'row', gap: 16 },
  muscleColumn: { flex: 1 },
  muscleLabel: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 2 },
  muscleValue: { fontSize: 15, color: '#333' },
  stepItem: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  stepNumber: { fontSize: 16, fontWeight: '700', color: '#2B7A0B', minWidth: 28 },
  stepText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 },
  mistakeItem: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  mistakeBullet: { fontSize: 16, fontWeight: '700', color: '#D32F2F', minWidth: 24 },
  mistakeText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 },
  tipSection: { backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FFA000' },
  tipLabel: { fontSize: 14, fontWeight: '700', color: '#F57F17', marginBottom: 4 },
  tipText: { fontSize: 15, color: '#333', lineHeight: 22 },
});