import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { EXERCISES, type Equipment, type Exercise, type ExerciseLevel, type MuscleGroup } from '@/data/exercises';
import { SPLITS, SPLIT_CATEGORIES, type Split, type SplitCategory, type SplitDay } from '@/data/splits';
import { CUSTOM_SPLITS_STORAGE_KEY, type CustomSplit } from '@/data/custom-splits';
import { CustomRoutineBuilder } from '@/components/custom-routine-builder';

type Target = { sets: number; reps: number; weight: number };
type Session = { date: string; weight: number; target: number; actual: number[] };
type Saved = {
  picked: Record<string, string[]>;
  targets: Record<string, Target>;
  history: Record<string, Session[]>;
};
type PickerEntry =
  | { kind: 'family'; base: Exercise; variations: Exercise[] }
  | { kind: 'exercise'; exercise: Exercise };

const TIER_COLOR = { S: '#E8B400', A: '#4C9AFF', B: '#8A8F98' };
const TIER_RANK = { S: 0, A: 1, B: 2 } as const;
const LEVEL_COLOR: Record<ExerciseLevel, string> = {
  easier: '#2E7D32',
  standard: '#4C9AFF',
  harder: '#C77700',
};
const LEVEL_ORDER: Record<ExerciseLevel, number> = { easier: 0, standard: 1, harder: 2 };
const DEFAULT_TARGET: Target = { sets: 3, reps: 8, weight: 20 };
const REP_MAX = 12;
const WEIGHT_STEP = 2.5;
const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'rearDelts', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs',
];
const EQUIPMENT_ORDER: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];

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

function LevelTag({ level }: { level: ExerciseLevel }) {
  const { t } = useTranslation();
  return (
    <View style={[s.levelTag, { backgroundColor: LEVEL_COLOR[level] }]}>
      <Text style={s.levelTagText}>{t(`exerciseLevels.${level}`)}</Text>
    </View>
  );
}

function familyBaseOf(exercise: Exercise): Exercise | undefined {
  return EXERCISES.find((item) => item.isBase && item.family === exercise.family);
}

function familyMembersOf(family: string): Exercise[] {
  return EXERCISES.filter((item) => item.family === family);
}

function ExerciseRow({
  exercise,
  selected,
  onPress,
}: {
  exercise: Exercise;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const reason = t(`exercises.${exercise.id}.reason`, { defaultValue: '' });
  const base = exercise.isBase ? undefined : familyBaseOf(exercise);
  const baseName = base ? t(`exercises.${base.id}.name`) : '';
  const note = exercise.variationNote ? t(exercise.variationNote) : '';
  const noteText = note === ''
    ? ''
    : baseName === ''
      ? note
      : t('exercisePicker.comparedWith', { name: baseName, note });
  const showLevel = familyMembersOf(exercise.family).length > 1;

  return (
    <TouchableOpacity style={[s.card, selected && s.cardOn]} onPress={onPress}>
      <View style={[s.badge, { backgroundColor: TIER_COLOR[exercise.tier] }]}>
        <Text style={s.badgeText}>{exercise.tier}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.variationTitleRow}>
          <Text style={s.cardText}>{t(`exercises.${exercise.id}.name`)}</Text>
          {showLevel && <LevelTag level={exercise.level} />}
        </View>
        {baseName !== '' && <Text style={s.baseName}>{baseName}</Text>}
        {noteText !== '' ? <Text style={s.sub}>{noteText}</Text> : reason !== '' ? <Text style={s.sub}>{reason}</Text> : null}
      </View>
      <Text style={s.check}>{selected ? '✓' : ''}</Text>
    </TouchableOpacity>
  );
}

function FamilyCard({
  base,
  variations,
  expanded,
  onToggleExpand,
  selectedIds,
  onToggleExercise,
}: {
  base: Exercise;
  variations: Exercise[];
  expanded: boolean;
  onToggleExpand: () => void;
  selectedIds: string[];
  onToggleExercise: (exerciseId: string) => void;
}) {
  const { t } = useTranslation();
  const baseName = t(`exercises.${base.id}.name`);
  const baseReason = t(`exercises.${base.id}.reason`, { defaultValue: '' });
  const baseSelected = selectedIds.includes(base.id);
  const ladder = [base, ...variations]
    .map((exercise, index) => ({ exercise, index }))
    .sort((a, b) =>
      (LEVEL_ORDER[a.exercise.level] - LEVEL_ORDER[b.exercise.level]) || (a.index - b.index),
    )
    .map((item) => item.exercise);

  return (
    <View style={[s.familyBlock, baseSelected && s.cardOn]}>
      <TouchableOpacity style={s.familyBaseRow} onPress={() => onToggleExercise(base.id)}>
        <View style={[s.badge, { backgroundColor: TIER_COLOR[base.tier] }]}>
          <Text style={s.badgeText}>{base.tier}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.cardText}>{baseName}</Text>
          {baseReason !== '' && <Text style={s.sub}>{baseReason}</Text>}
        </View>
        <Text style={s.check}>{baseSelected ? '✓' : ''}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.familyExpander}
        onPress={onToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={t('exercisePicker.variations', { count: variations.length })}>
        <Text style={s.familyExpanderText}>
          {expanded ? '▾' : '▸'} {t('exercisePicker.variations', { count: variations.length })}
        </Text>
      </TouchableOpacity>
      {expanded && ladder.map((exercise) => {
        const selected = selectedIds.includes(exercise.id);
        const isBaseRow = exercise.id === base.id;
        const note = !isBaseRow && exercise.variationNote ? t(exercise.variationNote) : '';
        const noteText = note === '' ? '' : t('exercisePicker.comparedWith', { name: baseName, note });
        return (
          <TouchableOpacity
            key={exercise.id}
            style={[s.variationRow, selected && s.cardOn]}
            onPress={() => onToggleExercise(exercise.id)}>
            <View style={s.variationContent}>
              <View style={s.variationTitleRow}>
                <Text style={s.variationName}>{t(`exercises.${exercise.id}.name`)}</Text>
                <LevelTag level={exercise.level} />
              </View>
              {noteText !== '' && <Text style={s.sub}>{noteText}</Text>}
            </View>
            <Text style={s.check}>{selected ? '✓' : ''}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | 'all'>('all');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<SplitCategory | 'all' | 'my_routines'>('all');
  const [logging, setLogging] = useState(false);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [targets, setTargets] = useState<Record<string, Target>>({});
  const [history, setHistory] = useState<Record<string, Session[]>>({});
  const [ready, setReady] = useState(false);
  const [customReady, setCustomReady] = useState(false);
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([]);
  const [builder, setBuilder] = useState<CustomSplit | 'new' | null>(null);

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
    AsyncStorage.getItem(CUSTOM_SPLITS_STORAGE_KEY)
      .then((raw) => {
        if (raw) setCustomSplits(JSON.parse(raw) as CustomSplit[]);
      })
      .catch(() => {})
      .finally(() => setCustomReady(true));
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

  const saveCustomSplit = async (custom: CustomSplit) => {
    const next = customSplits.some((item) => item.id === custom.id)
      ? customSplits.map((item) => item.id === custom.id ? custom : item)
      : [...customSplits, custom];
    try {
      await AsyncStorage.setItem(CUSTOM_SPLITS_STORAGE_KEY, JSON.stringify(next));
      setCustomSplits(next);
      setBuilder(null);
    } catch {
      Alert.alert(t('customRoutines.saveErrorTitle'), t('customRoutines.saveError'));
    }
  };

  const deleteCustomSplit = (custom: CustomSplit) => {
    Alert.alert(t('customRoutines.deleteTitle'), t('customRoutines.deleteConfirm', { name: custom.name }), [
      { text: t('customRoutines.cancelDelete'), style: 'cancel' },
      {
        text: t('customRoutines.deleteRoutine'),
        style: 'destructive',
        onPress: async () => {
          const next = customSplits.filter((item) => item.id !== custom.id);
          try {
            await AsyncStorage.setItem(CUSTOM_SPLITS_STORAGE_KEY, JSON.stringify(next));
            setCustomSplits(next);
          } catch {
            Alert.alert(t('customRoutines.saveErrorTitle'), t('customRoutines.saveError'));
          }
        },
      },
    ]);
  };

  const openDay = (dayId: string) => {
    setExerciseSearch('');
    setMuscleFilter('all');
    setEquipmentFilter('all');
    setExpandedFamilies({});
    setDay(dayId);
  };

  const back = () => {
    if (logging) setLogging(false);
    else if (day) setDay(null);
    else setSplit(null);
  };

  if (!ready || !customReady) return <SafeAreaView style={s.screen} />;

  const currentSplit = split ? SPLITS.find((item) => item.id === split) ?? null : null;
  const currentCustomSplit = split ? customSplits.find((item) => item.id === split) ?? null : null;
  const currentDay = currentSplit?.days.find((item) => item.id === day) ?? null;
  const currentCustomDay = currentCustomSplit?.days.find((item) => item.id === day) ?? null;
  const currentDayExercises = currentDay
    ? exercisesForDay(currentDay)
    : currentCustomDay
      ? EXERCISES.filter((exercise) =>
        currentCustomDay.muscleGroups.includes(exercise.primaryMuscleGroup) || currentCustomDay.exerciseIds.includes(exercise.id),
      )
      : [];
  const normalizedExerciseSearch = exerciseSearch.trim().toLocaleLowerCase();
  const availableMuscleGroups = MUSCLE_GROUP_ORDER.filter((group) =>
    currentDayExercises.some((exercise) => exercise.primaryMuscleGroup === group),
  );
  const availableEquipment = EQUIPMENT_ORDER.filter((equipment) =>
    currentDayExercises.some((exercise) => exercise.equipment === equipment),
  );
  const filteredDayExercises = currentDayExercises.filter((exercise) => {
    if (muscleFilter !== 'all' && exercise.primaryMuscleGroup !== muscleFilter) return false;
    if (equipmentFilter !== 'all' && exercise.equipment !== equipmentFilter) return false;
    if (normalizedExerciseSearch === '') return true;
    return (
      exercise.name.toLocaleLowerCase().includes(normalizedExerciseSearch) ||
      t(`exercises.${exercise.id}.name`).toLocaleLowerCase().includes(normalizedExerciseSearch)
    );
  });
  const flatResults = normalizedExerciseSearch !== '' || equipmentFilter !== 'all';
  const familyGroups = new Map<string, { base: Exercise; variations: Exercise[]; tier: 'S' | 'A' | 'B' }>();
  if (!flatResults) {
    const membersByFamily = new Map<string, Exercise[]>();
    for (const exercise of filteredDayExercises) {
      const members = membersByFamily.get(exercise.family) ?? [];
      members.push(exercise);
      membersByFamily.set(exercise.family, members);
    }
    for (const [family, members] of membersByFamily) {
      const base = members.find((item) => item.isBase) ?? familyBaseOf(members[0]);
      if (!base) continue;
      const variations = familyMembersOf(family).filter((item) => item.id !== base.id);
      if (variations.length === 0) continue;
      const tier = variations.reduce<'S' | 'A' | 'B'>(
        (best, item) => TIER_RANK[item.tier] < TIER_RANK[best] ? item.tier : best,
        base.tier,
      );
      familyGroups.set(family, { base, variations, tier });
    }
  }
  const pickerEntries: Record<'S' | 'A' | 'B', PickerEntry[]> = { S: [], A: [], B: [] };
  const renderedFamilies = new Set<string>();
  for (const exercise of filteredDayExercises) {
    const group = familyGroups.get(exercise.family);
    if (group) {
      if (renderedFamilies.has(exercise.family)) continue;
      renderedFamilies.add(exercise.family);
      pickerEntries[group.tier].push({ kind: 'family', base: group.base, variations: group.variations });
    } else {
      pickerEntries[exercise.tier].push({ kind: 'exercise', exercise });
    }
  }
  const normalizedSearch = splitSearch.trim().toLocaleLowerCase();
  const myRoutines = category === 'my_routines';
  const matchingSplits = SPLITS.filter((item) =>
    item.nameKey && t(item.nameKey).toLocaleLowerCase().includes(normalizedSearch) &&
    (category === 'all' || (category !== 'my_routines' && item.categories.includes(category)))
  );
  const matchingCustomSplits = customSplits.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedSearch) && (category === 'all' || myRoutines),
  );
  const showFilteredResults = normalizedSearch !== '' || category !== 'all';

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {builder !== null && (
          <CustomRoutineBuilder
            routine={builder === 'new' ? undefined : builder}
            onCancel={() => setBuilder(null)}
            onSave={saveCustomSplit}
          />
        )}
        {split && (
          <TouchableOpacity onPress={back}>
            <Text style={s.back}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}

        {!split && builder === null && (
          <>
            <Text style={s.title}>{t('common.chooseSplit')}</Text>
            <TouchableOpacity style={s.createRoutineCard} onPress={() => setBuilder('new')}>
              <View style={s.createIcon}><Text style={s.createIconText}>+</Text></View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.cardText}>{t('customRoutines.createRoutine')}</Text>
                <Text style={s.sub}>{t('customRoutines.createRoutineHint')}</Text>
              </View>
            </TouchableOpacity>
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
                {matchingCustomSplits.map((item) => (
                  <View key={item.id} style={s.customRoutineRow}>
                    <TouchableOpacity style={s.customRoutineMain} onPress={() => setSplit(item.id)}>
                      <Text style={s.cardText} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.splitMeta}>{t('customRoutines.daysCount', { count: item.days.length })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBuilder(item)}><Text style={s.actionText}>{t('customRoutines.edit')}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteCustomSplit(item)}><Text style={s.deleteText}>{t('customRoutines.deleteRoutine')}</Text></TouchableOpacity>
                  </View>
                ))}
                {matchingSplits.length + matchingCustomSplits.length === 0 && <Text style={s.sub}>{t('splitPicker.noResults')}</Text>}
              </>
            )}
            <LanguageSwitcher />
          </>
        )}

        {(currentSplit || currentCustomSplit) && !day && (
          <>
            <Text style={s.title}>{currentCustomSplit ? currentCustomSplit.name : t(currentSplit!.nameKey)}</Text>
            {currentSplit && <Text style={s.sub}>{t(currentSplit.descriptionKey)}</Text>}
            {(currentSplit?.days ?? currentCustomSplit?.days ?? []).map((splitDay) => {
              const pickedCount = (picked[`${split}|${splitDay.id}`] ?? []).length;
              const dayName = 'nameKey' in splitDay ? t(splitDay.nameKey) : splitDay.name;
              return (
                <TouchableOpacity key={splitDay.id} style={s.card} onPress={() => openDay(splitDay.id)}>
                  <View>
                    <Text style={s.cardText}>{dayName}</Text>
                    <Text style={s.sub}>{t('common.exercisesPicked', { count: pickedCount })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {(currentDay || currentCustomDay) && !logging && (
          <>
            <Text style={s.title}>{currentCustomDay ? currentCustomDay.name : t(currentDay!.nameKey)}</Text>
            <Text style={s.sub}>{t('common.tapToPick')}</Text>
            <TextInput
              style={s.searchInput}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholder={t('exerciseFilters.searchPlaceholder')}
              accessibilityLabel={t('exerciseFilters.searchPlaceholder')}
            />
            <Text style={s.filterLabel}>{t('exerciseFilters.muscleGroup')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
              {(['all', ...availableMuscleGroups] as Array<MuscleGroup | 'all'>).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[s.categoryChip, muscleFilter === item && s.categoryChipActive]}
                  onPress={() => setMuscleFilter(item)}>
                  <Text style={[s.categoryChipText, muscleFilter === item && s.categoryChipTextActive]}>
                    {item === 'all' ? t('exerciseFilters.all') : t(`muscleGroups.${item}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.filterLabel}>{t('exerciseFilters.equipment')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
              {(['all', ...availableEquipment] as Array<Equipment | 'all'>).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[s.categoryChip, equipmentFilter === item && s.categoryChipActive]}
                  onPress={() => setEquipmentFilter(item)}>
                  <Text style={[s.categoryChipText, equipmentFilter === item && s.categoryChipTextActive]}>
                    {item === 'all' ? t('exerciseFilters.all') : t(`equipment.${item}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filteredDayExercises.length === 0 && <Text style={s.sub}>{t('exerciseFilters.noResults')}</Text>}
            {(['S', 'A', 'B'] as const).map((tier) =>
              pickerEntries[tier].map((entry) =>
                entry.kind === 'family' ? (
                  <FamilyCard
                    key={entry.base.family}
                    base={entry.base}
                    variations={entry.variations}
                    expanded={!!expandedFamilies[entry.base.family]}
                    onToggleExpand={() => setExpandedFamilies((current) => ({
                      ...current,
                      [entry.base.family]: !current[entry.base.family],
                    }))}
                    selectedIds={pickedNow}
                    onToggleExercise={toggle}
                  />
                ) : (
                  <ExerciseRow
                    key={entry.exercise.id}
                    exercise={entry.exercise}
                    selected={pickedNow.includes(entry.exercise.id)}
                    onPress={() => toggle(entry.exercise.id)}
                  />
                )
              )
            )}
            {pickedNow.length > 0 && (
              <TouchableOpacity style={s.primary} onPress={() => setLogging(true)}>
                <Text style={s.primaryText}>{t('common.startWorkout', { count: pickedNow.length })}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {(currentDay || currentCustomDay) && logging && (
          <>
            <Text style={s.title}>{currentCustomDay ? currentCustomDay.name : t(currentDay!.nameKey)} {t('common.workout')}</Text>
            {pickedNow.map((exerciseId) => {
              const exercise = EXERCISES.find((e) => e.id === exerciseId);
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
  familyBlock: { borderRadius: 14, backgroundColor: '#F2F3F5', overflow: 'hidden' },
  familyBaseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  familyExpander: { paddingHorizontal: 16, paddingBottom: 12, marginTop: -6 },
  familyExpanderText: { fontSize: 13, fontWeight: '700', color: '#2873B9' },
  variationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E3E5E8' },
  variationContent: { flex: 1, gap: 5 },
  variationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  variationName: { fontSize: 15, fontWeight: '600', color: '#222' },
  baseName: { fontSize: 12, fontWeight: '600', color: '#8A8F98' },
  levelTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  levelTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cardText: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, color: '#666' },
  splitMeta: { fontSize: 12, fontWeight: '600', color: '#4C9AFF', marginTop: 2 },
  searchInput: { height: 46, borderRadius: 12, backgroundColor: '#F2F3F5', paddingHorizontal: 14, fontSize: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 4 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#F2F3F5' },
  categoryChipActive: { backgroundColor: '#2B7A0B' },
  categoryChipText: { color: '#444', fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: '#fff' },
  createRoutineCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#B9D8B4', backgroundColor: '#F3FAF1' },
  createIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B7A0B' },
  createIconText: { color: '#fff', fontSize: 25, lineHeight: 29, fontWeight: '500' },
  customRoutineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: '#F2F3F5' },
  customRoutineMain: { flex: 1, gap: 4 },
  actionText: { color: '#2873B9', fontSize: 12, fontWeight: '700' },
  deleteText: { color: '#B42318', fontSize: 12, fontWeight: '700' },
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
