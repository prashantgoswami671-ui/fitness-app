import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EXERCISES } from '@/data/exercises';
import { createStableId, MUSCLE_GROUPS, type CustomSplit, type CustomSplitDay } from '@/data/custom-splits';

type BuilderDay = CustomSplitDay & { exerciseSearch: string };

export function CustomRoutineBuilder({
  routine,
  onCancel,
  onSave,
}: {
  routine?: CustomSplit;
  onCancel: () => void;
  onSave: (value: CustomSplit) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(routine?.name ?? '');
  const [days, setDays] = useState<BuilderDay[]>(() => routine
    ? routine.days.map((day) => ({ ...day, exerciseSearch: '' }))
    : [{ id: createStableId('day'), name: '', muscleGroups: [], exerciseIds: [], exerciseSearch: '' }]);

  const updateDay = (dayId: string, update: (day: BuilderDay) => BuilderDay) => {
    setDays((current) => current.map((day) => day.id === dayId ? update(day) : day));
  };

  const save = () => {
    if (!name.trim()) {
      Alert.alert(t('customRoutines.validationTitle'), t('customRoutines.routineNameRequired'));
      return;
    }
    if (days.length === 0) {
      Alert.alert(t('customRoutines.validationTitle'), t('customRoutines.dayRequired'));
      return;
    }
    const invalidDay = days.find((day) => !day.name.trim() || (day.muscleGroups.length === 0 && day.exerciseIds.length === 0));
    if (invalidDay) {
      Alert.alert(
        t('customRoutines.validationTitle'),
        !invalidDay.name.trim() ? t('customRoutines.dayNameRequired') : t('customRoutines.dayNeedsExercises'),
      );
      return;
    }
    onSave({
      id: routine?.id ?? createStableId('routine'),
      name,
      days: days.map(({ exerciseSearch: _exerciseSearch, ...day }) => day),
    });
  };

  const moveDay = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= days.length) return;
    setDays((current) => {
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel}><Text style={styles.back}>{t('common.back')}</Text></TouchableOpacity>
      <Text style={styles.title}>{t(routine ? 'customRoutines.editTitle' : 'customRoutines.createTitle')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('customRoutines.routineNamePlaceholder')}
        accessibilityLabel={t('customRoutines.routineNamePlaceholder')}
      />
      {days.map((day, index) => {
        const search = day.exerciseSearch.trim().toLocaleLowerCase();
        const visibleExercises = EXERCISES.filter((exercise) =>
          t(`exercises.${exercise.id}.name`).toLocaleLowerCase().includes(search) ||
          exercise.name.toLocaleLowerCase().includes(search),
        );
        return (
          <View key={day.id} style={styles.dayCard}>
            <View style={styles.dayActions}>
              <Text style={styles.dayTitle}>{t('customRoutines.dayNumber', { number: index + 1 })}</Text>
              <TouchableOpacity disabled={index === 0} onPress={() => moveDay(index, -1)}><Text style={[styles.action, index === 0 && styles.disabled]}>{t('customRoutines.moveUp')}</Text></TouchableOpacity>
              <TouchableOpacity disabled={index === days.length - 1} onPress={() => moveDay(index, 1)}><Text style={[styles.action, index === days.length - 1 && styles.disabled]}>{t('customRoutines.moveDown')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDays((current) => current.filter((item) => item.id !== day.id))}><Text style={styles.delete}>{t('customRoutines.deleteDay')}</Text></TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={day.name}
              onChangeText={(value) => updateDay(day.id, (current) => ({ ...current, name: value }))}
              placeholder={t('customRoutines.dayNamePlaceholder')}
              accessibilityLabel={t('customRoutines.dayNamePlaceholder')}
            />
            <Text style={styles.section}>{t('customRoutines.muscleGroups')}</Text>
            <View style={styles.chips}>
              {MUSCLE_GROUPS.map((group) => {
                const selected = day.muscleGroups.includes(group);
                return (
                  <TouchableOpacity
                    key={group}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => updateDay(day.id, (current) => ({
                      ...current,
                      muscleGroups: selected
                        ? current.muscleGroups.filter((item) => item !== group)
                        : [...current.muscleGroups, group],
                    }))}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(`muscleGroups.${group}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.section}>{t('customRoutines.chooseExercises')}</Text>
            <TextInput
              style={styles.input}
              value={day.exerciseSearch}
              onChangeText={(value) => updateDay(day.id, (current) => ({ ...current, exerciseSearch: value }))}
              placeholder={t('customRoutines.exerciseSearchPlaceholder')}
              accessibilityLabel={t('customRoutines.exerciseSearchPlaceholder')}
            />
            <View style={styles.exerciseList}>
              {visibleExercises.map((exercise) => {
                const selected = day.exerciseIds.includes(exercise.id);
                return (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[styles.exerciseRow, selected && styles.exerciseSelected]}
                    onPress={() => updateDay(day.id, (current) => ({
                      ...current,
                      exerciseIds: selected
                        ? current.exerciseIds.filter((id) => id !== exercise.id)
                        : [...current.exerciseIds, exercise.id],
                    }))}
                  >
                    <Text style={styles.exerciseName}>{t(`exercises.${exercise.id}.name`)}</Text>
                    <Text style={styles.check}>{selected ? '✓' : '+'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      <TouchableOpacity style={styles.secondary} onPress={() => setDays((current) => [
        ...current,
        { id: createStableId('day'), name: '', muscleGroups: [], exerciseIds: [], exerciseSearch: '' },
      ])}>
        <Text style={styles.secondaryText}>{t('customRoutines.addDay')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primary} onPress={save}><Text style={styles.primaryText}>{t('customRoutines.saveRoutine')}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  back: { fontSize: 16, color: '#4C9AFF' },
  input: { minHeight: 44, borderRadius: 10, backgroundColor: '#F2F3F5', paddingHorizontal: 12, fontSize: 15 },
  dayCard: { padding: 14, borderRadius: 14, backgroundColor: '#F2F3F5', gap: 10 },
  dayActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  dayTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  action: { fontSize: 13, fontWeight: '600', color: '#4C9AFF' },
  disabled: { color: '#AAA' },
  delete: { fontSize: 13, fontWeight: '600', color: '#B42318' },
  section: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: '#fff' },
  chipSelected: { backgroundColor: '#2B7A0B' },
  chipText: { fontSize: 12, color: '#444' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  exerciseList: { gap: 6 },
  exerciseRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#fff' },
  exerciseSelected: { backgroundColor: '#DCEBFF' },
  exerciseName: { flex: 1, fontSize: 13, color: '#333' },
  check: { fontSize: 18, fontWeight: '700', color: '#2B7A0B' },
  secondary: { padding: 13, borderRadius: 11, alignItems: 'center', backgroundColor: '#E8F5E9' },
  secondaryText: { color: '#2B7A0B', fontWeight: '700' },
  primary: { backgroundColor: '#2B7A0B', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
