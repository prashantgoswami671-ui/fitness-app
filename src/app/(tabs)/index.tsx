import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { EXERCISES, type Exercise } from '@/data/exercises';
import { SPLITS, SPLIT_CATEGORIES, type Split, type SplitCategory, type SplitDay } from '@/data/splits';

type Target = { sets: number; reps: number; weight: number };
type Session = { date: string; weight: number; target: number; actual: number[] };
type Saved = {
  picked: Record<string, string[]>;
  targets: Record<string, Target>;
  history: Record<string, Session[]>;
};

const TIER_COLOR = { S: '#E8B400', A: '#4C9AFF', B: '#8A8F98' };
const DEFAULT_TARGET: Target = { sets: 3, reps: 8, weight: 20 };
const REP_MAX = 12;
const WEIGHT_STEP = 2.5;

function suggest(t: Target, actual: number[], tFunc: (key: string, options?: any) => string): { next: Target; message: string } {
  if (actual.every((r) => r >= REP_MAX)) {
    const w = t.weight + WEIGHT_STEP;
    return {
      next: { ...t, reps: 8, weight: w },
      message: tFunc('suggest.hitMaxReps', { maxReps: REP_MAX, weight: w }),
    };
  }
  if (actual.every((r) => r >= t.reps)) {
    const r = Math.min(t.reps + 1, REP_MAX);
    return {
      next: { ...t, reps: r },
      message: tFunc('suggest.targetHit', { weight: t.weight, reps: r }),
    };
  }
  return {
    next: t,
    message: tFunc('suggest.stayAtWeight', { actual: actual.join(', '), weight: t.weight, targetReps: t.reps }),
  };
}

function exercisesForDay(day: SplitDay): Exercise[] {
  if ('focusLifts' in day && day.focusLifts) {
    return EXERCISES.filter((exercise) => day.focusLifts.includes(exercise.id));
  }
  if ('muscleGroups' in day && day.muscleGroups) {
    return EXERCISES.filter((exercise) => day.muscleGroups.includes(exercise.primaryMuscleGroup));
  }
  return [];
}

function SplitCard({ split, onPress, compact = false }: { split: Split; onPress: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={[s.card, s.splitCard, compact && s.popularCard]} onPress={onPress}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.cardText} numberOfLines={1}>{t(split.nameKey)}</Text>
        <Text style={s.splitMeta}>{t('splitPicker.splitMeta', { days: split.daysPerWeek, level: t(`levels.${split.level}`) })}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Stepper(props: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min, onChange } = props;
  const { t } = useTranslation();
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{t(label)}</Text>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
      >
        <Text style={s.stepBtnText}>-</Text>
      </TouchableOpacity>
      <Text style={s.stepVal}>{value}</Text>
      <TouchableOpacity style={s.stepBtn} onPress={() => onChange(+(value + step).toFixed(1))}>
        <Text style={s.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  target: Target;
  last?: Session;
  onTarget: (t: Target) => void;
  onSave: (actual: number[]) => string;
}

function ExerciseCard({ exercise, target, last, onTarget, onSave }: ExerciseCardProps) {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  const save = () => {
    const actual = Array.from({ length: target.sets }, (_, i) => parseInt(inputs[i] ?? '', 10));
    if (actual.some((n) => !n || n < 1)) {
      setMsg(t('common.enterReps'));
      return;
    }
    setMsg(onSave(actual));
    setInputs([]);
  };

  const exerciseName = t(`exercises.${exercise.id}.name`);
  const openGuide = () => router.push(`/guide/${exercise.id}` as any);

  return (
    <View style={s.logCard}>
      <View style={s.exerciseHeader}>
        <Text style={s.cardText}>{exerciseName}</Text>
        <TouchableOpacity style={s.guideBtn} onPress={openGuide}>
          <Text style={s.guideBtnText}>{t('common.guide')}</Text>
        </TouchableOpacity>
      </View>
      {last && (
        <Text style={s.sub}>
          {t('common.lastTime', { weight: last.weight, reps: last.actual.join(', '), target: last.target })}
        </Text>
      )}

      <Text style={s.section}>
        {t('common.target', { sets: target.sets, reps: target.reps, weight: target.weight })}
      </Text>
      <Stepper label="common.sets" value={target.sets} step={1} min={1} onChange={(v) => onTarget({ ...target, sets: v })} />
      <Stepper label="common.reps" value={target.reps} step={1} min={1} onChange={(v) => onTarget({ ...target, reps: v })} />
      <Stepper label="common.kg" value={target.weight} step={WEIGHT_STEP} min={0} onChange={(v) => onTarget({ ...target, weight: v })} />

      <Text style={s.section}>{t('common.whatYouDid')}</Text>
      <View style={s.row}>
        {Array.from({ length: target.sets }, (_, i) => (
          <TextInput
            key={i}
            style={s.input}
            keyboardType="number-pad"
            placeholder={`S${i + 1}`}
            value={inputs[i] ?? ''}
            onChangeText={(v) =>
              setInputs((prev) => {
                const copy = [...prev];
                copy[i] = v;
                return copy;
              })
            }
          />
        ))}
      </View>

      <TouchableOpacity style={s.primary} onPress={save}>
        <Text style={s.primaryText}>{t('common.save')}</Text>
      </TouchableOpacity>
      {msg !== '' && <Text style={s.msg}>{msg}</Text>}
    </View>
  );
}

function LanguageSwitcher() {
  const { t } = useTranslation();
  const { changeLanguage, getAvailableLanguages, getCurrentLanguage } = require('@/i18n');
  const [languages] = useState(getAvailableLanguages());
  const currentLang = getCurrentLanguage();

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang as any);
  };

  return (
    <View style={s.languageSwitcher}>
      <Text style={s.languageLabel}>{t('language.switcherTitle')}</Text>
      <View style={s.languageButtons}>
        {languages.map(({ code, name }: { code: string; name: string }) => (
          <TouchableOpacity
            key={code}
            style={[s.languageBtn, currentLang === code && s.languageBtnActive]}
            onPress={() => handleLanguageChange(code)}
          >
            <Text style={[s.languageBtnText, currentLang === code && s.languageBtnTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [split, setSplit] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [splitSearch, setSplitSearch] = useState('');
  const [category, setCategory] = useState<SplitCategory | 'all' | 'my_routines'>('all');
  const [logging, setLogging] = useState(false);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [targets, setTargets] = useState<Record<string, Target>>({});
  const [history, setHistory] = useState<Record<string, Session[]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('fitness-state')
      .then((raw) => {
        if (raw) {
          const d: Saved = JSON.parse(raw);
          setPicked(d.picked ?? {});
          setTargets(d.targets ?? {});
          setHistory(d.history ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem('fitness-state', JSON.stringify({ picked, targets, history })).catch(() => {});
    }
  }, [ready, picked, targets, history]);

  const key = `${split}|${day}`;
  const pickedNow = picked[key] ?? [];

  const toggle = (exerciseId: string) =>
    setPicked((p) => {
      const cur = p[key] ?? [];
      return { ...p, [key]: cur.includes(exerciseId) ? cur.filter((n) => n !== exerciseId) : [...cur, exerciseId] };
    });

  const saveSession = (exerciseId: string, actual: number[]) => {
    const t = targets[exerciseId] ?? DEFAULT_TARGET;
    const { next, message } = suggest(t, actual, i18n.t.bind(i18n));
    const session: Session = {
      date: new Date().toISOString().slice(0, 10),
      weight: t.weight,
      target: t.reps,
      actual,
    };
    setHistory((h) => ({ ...h, [exerciseId]: [...(h[exerciseId] ?? []), session] }));
    setTargets((x) => ({ ...x, [exerciseId]: next }));
    return message;
  };

  const back = () => {
    if (logging) setLogging(false);
    else if (day) setDay(null);
    else setSplit(null);
  };

  if (!ready) return <SafeAreaView style={s.screen} />;

  const currentSplit = split ? SPLITS.find((item) => item.id === split) ?? null : null;
  const currentDay = currentSplit?.days.find((item) => item.id === day) ?? null;
  const currentDayExercises = currentDay ? exercisesForDay(currentDay) : [];
  const normalizedSearch = splitSearch.trim().toLocaleLowerCase();
  const myRoutines = category === 'my_routines';
  const matchingSplits = SPLITS.filter((item) =>
    item.nameKey && t(item.nameKey).toLocaleLowerCase().includes(normalizedSearch) &&
    (category === 'all' || (category !== 'my_routines' && item.categories.includes(category)))
  );
  const showFilteredResults = normalizedSearch !== '' || category !== 'all';

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {split && (
          <TouchableOpacity onPress={back}>
            <Text style={s.back}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}

        {!split && (
          <>
            <Text style={s.title}>{t('common.chooseSplit')}</Text>
            <TextInput
              style={s.searchInput}
              value={splitSearch}
              onChangeText={setSplitSearch}
              placeholder={t('splitPicker.searchPlaceholder')}
              accessibilityLabel={t('splitPicker.searchPlaceholder')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
              {(['all', ...SPLIT_CATEGORIES, 'my_routines'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[s.categoryChip, category === item && s.categoryChipActive]}
                  onPress={() => setCategory(item)}>
                  <Text style={[s.categoryChipText, category === item && s.categoryChipTextActive]}>
                    {item === 'all' ? t('splitPicker.all') : item === 'my_routines' ? t('splitPicker.myRoutines') : t(`categories.${item}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!showFilteredResults ? (
              <>
                <Text style={s.section}>{t('splitPicker.popular')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.popularRow}>
                  {SPLITS.filter((item) => item.popular).map((item) => (
                    <SplitCard key={item.id} split={item} compact onPress={() => setSplit(item.id)} />
                  ))}
                </ScrollView>
                <Text style={s.section}>{t('splitPicker.moreSplits')}</Text>
                {SPLITS.filter((item) => !item.popular).map((item) => (
                  <SplitCard key={item.id} split={item} onPress={() => setSplit(item.id)} />
                ))}
              </>
            ) : (
              <>
                <Text style={s.section}>{t('splitPicker.results')}</Text>
                {matchingSplits.map((item) => <SplitCard key={item.id} split={item} onPress={() => setSplit(item.id)} />)}
                {(matchingSplits.length === 0 || myRoutines) && <Text style={s.sub}>{t('splitPicker.noResults')}</Text>}
              </>
            )}
            <LanguageSwitcher />
          </>
        )}

        {currentSplit && !day && (
          <>
            <Text style={s.title}>{t(currentSplit.nameKey)}</Text>
            <Text style={s.sub}>{t(currentSplit.descriptionKey)}</Text>
            {currentSplit.days.map((splitDay) => {
              const pickedCount = (picked[`${split}|${splitDay.id}`] ?? []).length;
              return (
                <TouchableOpacity key={splitDay.id} style={s.card} onPress={() => setDay(splitDay.id)}>
                  <View>
                    <Text style={s.cardText}>{t(splitDay.nameKey)}</Text>
                    <Text style={s.sub}>{t('common.exercisesPicked', { count: pickedCount })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {currentSplit && currentDay && !logging && (
          <>
            <Text style={s.title}>{t(currentDay.nameKey)}</Text>
            <Text style={s.sub}>{t('common.tapToPick')}</Text>
            {(['S', 'A', 'B'] as const).map((tier) =>
              currentDayExercises
                .filter((e) => e.tier === tier)
                .map((exercise) => {
                  const on = pickedNow.includes(exercise.id);
                  const exerciseName = t(`exercises.${exercise.id}.name`);
                  const exerciseReason = t(`exercises.${exercise.id}.reason`);
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[s.card, on && s.cardOn]}
                      onPress={() => toggle(exercise.id)}
                    >
                      <View style={[s.badge, { backgroundColor: TIER_COLOR[tier] }]}>
                        <Text style={s.badgeText}>{tier}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardText}>{exerciseName}</Text>
                        <Text style={s.sub}>{exerciseReason}</Text>
                      </View>
                      <Text style={s.check}>{on ? '✓' : ''}</Text>
                    </TouchableOpacity>
                  );
                })
            )}
            {pickedNow.length > 0 && (
              <TouchableOpacity style={s.primary} onPress={() => setLogging(true)}>
                <Text style={s.primaryText}>{t('common.startWorkout', { count: pickedNow.length })}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {currentSplit && currentDay && logging && (
          <>
            <Text style={s.title}>{t(currentDay.nameKey)} {t('common.workout')}</Text>
            {pickedNow.map((exerciseId) => {
              const exercise = currentDayExercises.find((e) => e.id === exerciseId);
              if (!exercise) return null;
              return (
                <ExerciseCard
                  key={exerciseId}
                  exercise={exercise}
                  target={targets[exerciseId] ?? DEFAULT_TARGET}
                  last={(history[exerciseId] ?? []).slice(-1)[0]}
                  onTarget={(t) => setTargets((x) => ({ ...x, [exerciseId]: t }))}
                  onSave={(actual) => saveSession(exerciseId, actual)}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 20, gap: 12, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  back: { fontSize: 16, color: '#4C9AFF', marginBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, backgroundColor: '#F2F3F5',
  },
  splitCard: { paddingVertical: 12 },
  popularCard: { width: 190, minHeight: 76, marginRight: 10 },
  popularRow: { paddingVertical: 2 },
  cardOn: { backgroundColor: '#DCEBFF' },
  cardText: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, color: '#666' },
  splitMeta: { fontSize: 12, fontWeight: '600', color: '#4C9AFF', marginTop: 2 },
  searchInput: { height: 46, borderRadius: 12, backgroundColor: '#F2F3F5', paddingHorizontal: 14, fontSize: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#F2F3F5' },
  categoryChipActive: { backgroundColor: '#2B7A0B' },
  categoryChipText: { color: '#444', fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: '#fff' },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '700' },
  check: { fontSize: 20, color: '#2B7A0B', width: 20 },
  logCard: { padding: 16, borderRadius: 14, backgroundColor: '#F2F3F5', gap: 8 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guideBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#E8F5E9', borderRadius: 8 },
  guideBtnText: { fontSize: 13, fontWeight: '600', color: '#2B7A0B' },
  section: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepLabel: { width: 50, fontSize: 14, color: '#444' },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 20, fontWeight: '700' },
  stepVal: { minWidth: 44, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  input: {
    width: 64, height: 44, borderRadius: 10, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 16,
  },
  primary: { backgroundColor: '#2B7A0B', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  msg: { fontSize: 14, color: '#1B4F72', marginTop: 4 },
  languageSwitcher: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  languageLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  languageButtons: { flexDirection: 'row', gap: 8 },
  languageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F2F3F5' },
  languageBtnActive: { backgroundColor: '#2B7A0B' },
  languageBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  languageBtnTextActive: { color: '#fff' },
});
