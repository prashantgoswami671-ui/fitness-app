import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

type Exercise = {
  id: string;
  name: string;
  tier: 'S' | 'A' | 'B';
  reason: string;
};

type Target = { sets: number; reps: number; weight: number };
type Session = { date: string; weight: number; target: number; actual: number[] };
type Saved = {
  picked: Record<string, string[]>;
  targets: Record<string, Target>;
  history: Record<string, Session[]>;
};

const SPLITS: Record<string, Record<string, Exercise[]>> = {
  'pushPullLegs': {
    push: [
      { id: 'incline_db_press', name: '', tier: 'S', reason: '' },
      { id: 'flat_bb_bench', name: '', tier: 'S', reason: '' },
      { id: 'cable_lateral_raise', name: '', tier: 'A', reason: '' },
      { id: 'overhead_triceps_ext', name: '', tier: 'A', reason: '' },
      { id: 'pushups', name: '', tier: 'B', reason: '' },
    ],
    pull: [
      { id: 'lat_pulldown', name: '', tier: 'S', reason: '' },
      { id: 'chest_supported_row', name: '', tier: 'S', reason: '' },
      { id: 'incline_db_curl', name: '', tier: 'A', reason: '' },
      { id: 'face_pull', name: '', tier: 'A', reason: '' },
      { id: 'barbell_curl', name: '', tier: 'B', reason: '' },
    ],
    legs: [
      { id: 'squat', name: '', tier: 'S', reason: '' },
      { id: 'romanian_deadlift', name: '', tier: 'S', reason: '' },
      { id: 'leg_press', name: '', tier: 'A', reason: '' },
      { id: 'seated_leg_curl', name: '', tier: 'A', reason: '' },
      { id: 'standing_calf_raise', name: '', tier: 'B', reason: '' },
    ],
  },
  'upperLower': {
    upper: [
      { id: 'incline_db_press', name: '', tier: 'S', reason: '' },
      { id: 'lat_pulldown', name: '', tier: 'S', reason: '' },
      { id: 'seated_cable_row', name: '', tier: 'A', reason: '' },
      { id: 'cable_lateral_raise', name: '', tier: 'A', reason: '' },
      { id: 'dumbbell_curl', name: '', tier: 'B', reason: '' },
    ],
    lower: [
      { id: 'squat', name: '', tier: 'S', reason: '' },
      { id: 'romanian_deadlift', name: '', tier: 'S', reason: '' },
      { id: 'leg_press', name: '', tier: 'A', reason: '' },
      { id: 'leg_curl', name: '', tier: 'A', reason: '' },
      { id: 'calf_raise', name: '', tier: 'B', reason: '' },
    ],
  },
};

const SPLIT_DISPLAY_NAMES = {
  pushPullLegs: 'splits.pushPullLegs',
  upperLower: 'splits.upperLower',
};

const DAY_DISPLAY_NAMES = {
  push: 'splits.push',
  pull: 'splits.pull',
  legs: 'splits.legs',
  upper: 'splits.upper',
  lower: 'splits.lower',
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

  const currentSplitExercises = split ? SPLITS[split] : null;

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
            <LanguageSwitcher />
            {(Object.keys(SPLITS) as Array<keyof typeof SPLITS>).map((splitKey) => (
              <TouchableOpacity key={splitKey} style={s.card} onPress={() => setSplit(splitKey)}>
                <Text style={s.cardText}>{t(SPLIT_DISPLAY_NAMES[splitKey as keyof typeof SPLIT_DISPLAY_NAMES])}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {split && !day && (
          <>
            <Text style={s.title}>{t(SPLIT_DISPLAY_NAMES[split as keyof typeof SPLIT_DISPLAY_NAMES])}</Text>
            {(Object.keys(currentSplitExercises!) as Array<keyof typeof currentSplitExercises>).map((dayKey) => {
              const dayExercises = currentSplitExercises![dayKey];
              const pickedCount = (picked[`${split}|${dayKey}`] ?? []).length;
              return (
                <TouchableOpacity key={dayKey} style={s.card} onPress={() => setDay(dayKey)}>
                  <View>
                    <Text style={s.cardText}>{t(DAY_DISPLAY_NAMES[dayKey as keyof typeof DAY_DISPLAY_NAMES])}{t('common.day')}</Text>
                    <Text style={s.sub}>{t('common.exercisesPicked', { count: pickedCount })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {split && day && !logging && (
          <>
            <Text style={s.title}>{t(DAY_DISPLAY_NAMES[day as keyof typeof DAY_DISPLAY_NAMES])}{t('common.day')}</Text>
            <Text style={s.sub}>{t('common.tapToPick')}</Text>
            {(['S', 'A', 'B'] as const).map((tier) =>
              currentSplitExercises![day as keyof typeof currentSplitExercises]
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

        {split && day && logging && (
          <>
            <Text style={s.title}>{t(DAY_DISPLAY_NAMES[day as keyof typeof DAY_DISPLAY_NAMES])} {t('common.workout')}</Text>
            {pickedNow.map((exerciseId) => {
              const exercise = currentSplitExercises![day as keyof typeof currentSplitExercises].find((e) => e.id === exerciseId);
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
  cardOn: { backgroundColor: '#DCEBFF' },
  cardText: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, color: '#666' },
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