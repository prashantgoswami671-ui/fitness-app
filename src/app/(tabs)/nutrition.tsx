import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  createEmptyDay,
  DEFAULT_GOALS,
  generateId,
  getDayKey,
  getTodayKey,
  loadNutrition,
  saveNutrition,
  sumDay,
  sumMeal,
  type FoodEntry,
  type MealType,
  type NutritionGoals,
  type NutritionState,
} from '@/nutrition';

const MEALS: { key: MealType; labelKey: string }[] = [
  { key: 'breakfast', labelKey: 'nutrition.meals.breakfast' },
  { key: 'lunch', labelKey: 'nutrition.meals.lunch' },
  { key: 'dinner', labelKey: 'nutrition.meals.dinner' },
  { key: 'snacks', labelKey: 'nutrition.meals.snacks' },
];

const MACROS: { key: keyof NutritionGoals; labelKey: string; unitKey: string; color: string }[] = [
  { key: 'calories', labelKey: 'nutrition.macros.calories', unitKey: 'nutrition.units.kcal', color: '#E8B400' },
  { key: 'protein', labelKey: 'nutrition.macros.protein', unitKey: 'nutrition.units.grams', color: '#E53935' },
  { key: 'carbs', labelKey: 'nutrition.macros.carbs', unitKey: 'nutrition.units.grams', color: '#43A047' },
  { key: 'fat', labelKey: 'nutrition.macros.fat', unitKey: 'nutrition.units.grams', color: '#1E88E5' },
];

type Translator = (key: string, options?: Record<string, unknown>) => string;

type FoodDraft = {
  name: string;
  quantity: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

const EMPTY_FOOD_DRAFT: FoodDraft = {
  name: '',
  quantity: '',
  unit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

function formatNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}

function parseNonNegative(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function ProgressBar({ current, goal, color, label }: { current: number; goal: number; color: string; label: string }) {
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  return (
    <View
      style={s.progressTrack}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(percentage, 100) }}>
      <View style={[s.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function MacroCard({
  label,
  current,
  goal,
  unit,
  color,
  t,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  t: Translator;
}) {
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  return (
    <View style={s.macroCard}>
      <View style={s.macroHeader}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={[s.macroPct, { color }]}>{percentage}%</Text>
      </View>
      <Text style={[s.macroValue, { color }]}>
        {t('nutrition.totalAgainstGoal', {
          current: formatNumber(current),
          goal: formatNumber(goal),
          unit,
        })}
      </Text>
      <ProgressBar current={current} goal={goal} color={color} label={label} />
    </View>
  );
}

function MealSection({
  label,
  items,
  onAdd,
  onDelete,
  t,
}: {
  label: string;
  items: FoodEntry[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  t: Translator;
}) {
  const mealSum = sumMeal(items);
  return (
    <View style={s.mealSection}>
      <Text style={s.mealTitle}>{label}</Text>
      <Text style={s.mealSummary}>
        {t('nutrition.mealSummary', {
          calories: formatNumber(mealSum.calories),
          protein: formatNumber(mealSum.protein),
          carbs: formatNumber(mealSum.carbs),
          fat: formatNumber(mealSum.fat),
        })}
      </Text>
      {items.length === 0 ? (
        <Text style={s.emptyMeal}>{t('nutrition.emptyMeal')}</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={s.foodItem}>
            <View style={s.foodInfo}>
              <Text style={s.foodName}>{item.name}</Text>
              <Text style={s.foodDetails}>
                {t('nutrition.foodDetails', {
                  quantity: formatNumber(item.quantity),
                  unit: item.unit,
                  calories: formatNumber(item.calories),
                  protein: formatNumber(item.protein),
                  carbs: formatNumber(item.carbs),
                  fat: formatNumber(item.fat),
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => onDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={t('nutrition.deleteFood', { name: item.name })}>
              <Text style={s.deleteBtnText}>{t('nutrition.delete')}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <TouchableOpacity style={s.addFoodBtn} onPress={onAdd} accessibilityRole="button">
        <Text style={s.addFoodBtnText}>{t('nutrition.addFood')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={s.inputGroupFlex}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

function AddFoodModal({
  visible,
  onClose,
  onSave,
  mealType,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (food: Omit<FoodEntry, 'id'>) => void;
  mealType: MealType | null;
  t: Translator;
}) {
  const [draft, setDraft] = useState<FoodDraft>(EMPTY_FOOD_DRAFT);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft({ ...EMPTY_FOOD_DRAFT });
      setError('');
    }
  }, [visible, mealType]);

  if (!visible || !mealType) return null;

  const setField = (field: keyof FoodDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const mealLabel = t(`nutrition.meals.${mealType}`);

  const handleSave = () => {
    if (!draft.name.trim()) {
      setError(t('nutrition.errors.nameRequired'));
      return;
    }
    if (!draft.unit.trim()) {
      setError(t('nutrition.errors.unitRequired'));
      return;
    }

    const quantity = parseNonNegative(draft.quantity);
    const calories = parseNonNegative(draft.calories);
    const protein = parseNonNegative(draft.protein);
    const carbs = parseNonNegative(draft.carbs);
    const fat = parseNonNegative(draft.fat);
    if ([quantity, calories, protein, carbs, fat].some((value) => value === null)) {
      setError(t('nutrition.errors.numbersNonNegative'));
      return;
    }

    onSave({
      name: draft.name.trim(),
      quantity: quantity!,
      unit: draft.unit.trim(),
      calories: calories!,
      protein: protein!,
      carbs: carbs!,
      fat: fat!,
    });
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('nutrition.addFoodTo', { meal: mealLabel })}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={s.modalClose}
              accessibilityRole="button"
              accessibilityLabel={t('nutrition.close')}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            {error !== '' && <Text style={s.modalError}>{error}</Text>}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>{t('nutrition.fields.name')}</Text>
              <TextInput
                style={s.input}
                value={draft.name}
                onChangeText={(value) => setField('name', value)}
                placeholder={t('nutrition.fields.namePlaceholder')}
                autoCapitalize="words"
              />
            </View>
            <View style={s.inputRow}>
              <NumberField
                label={t('nutrition.fields.quantity')}
                value={draft.quantity}
                onChangeText={(value) => setField('quantity', value)}
                placeholder={t('nutrition.fields.quantityPlaceholder')}
              />
              <View style={s.inputGroupFlex}>
                <Text style={s.inputLabel}>{t('nutrition.fields.unit')}</Text>
                <TextInput
                  style={s.input}
                  value={draft.unit}
                  onChangeText={(value) => setField('unit', value)}
                  placeholder={t('nutrition.fields.unitPlaceholder')}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <Text style={s.formHint}>{t('nutrition.wholeQuantityHint')}</Text>
            <View style={s.inputRow}>
              <NumberField
                label={t('nutrition.fields.calories')}
                value={draft.calories}
                onChangeText={(value) => setField('calories', value)}
              />
              <NumberField
                label={t('nutrition.fields.protein')}
                value={draft.protein}
                onChangeText={(value) => setField('protein', value)}
              />
            </View>
            <View style={s.inputRow}>
              <NumberField
                label={t('nutrition.fields.carbs')}
                value={draft.carbs}
                onChangeText={(value) => setField('carbs', value)}
              />
              <NumberField
                label={t('nutrition.fields.fat')}
                value={draft.fat}
                onChangeText={(value) => setField('fat', value)}
              />
            </View>
          </ScrollView>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose} accessibilityRole="button">
              <Text style={s.modalCancelBtnText}>{t('nutrition.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSaveBtn} onPress={handleSave} accessibilityRole="button">
              <Text style={s.modalSaveBtnText}>{t('nutrition.saveFood')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GoalsModal({
  visible,
  onClose,
  goals,
  onSave,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  goals: NutritionGoals;
  onSave: (goals: NutritionGoals) => void;
  t: Translator;
}) {
  const [draft, setDraft] = useState<Record<keyof NutritionGoals, string>>({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft({
        calories: String(goals.calories),
        protein: String(goals.protein),
        carbs: String(goals.carbs),
        fat: String(goals.fat),
      });
      setError('');
    }
  }, [visible, goals]);

  if (!visible) return null;

  const setField = (field: keyof NutritionGoals, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const handleSave = () => {
    const calories = parseNonNegative(draft.calories);
    const protein = parseNonNegative(draft.protein);
    const carbs = parseNonNegative(draft.carbs);
    const fat = parseNonNegative(draft.fat);
    if ([calories, protein, carbs, fat].some((value) => value === null)) {
      setError(t('nutrition.errors.numbersNonNegative'));
      return;
    }
    onSave({ calories: calories!, protein: protein!, carbs: carbs!, fat: fat! });
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('nutrition.goals')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={s.modalClose}
              accessibilityRole="button"
              accessibilityLabel={t('nutrition.close')}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={s.modalBody}>
            {error !== '' && <Text style={s.modalError}>{error}</Text>}
            <NumberField
              label={t('nutrition.fields.caloriesGoal')}
              value={draft.calories}
              onChangeText={(value) => setField('calories', value)}
            />
            <NumberField
              label={t('nutrition.fields.proteinGoal')}
              value={draft.protein}
              onChangeText={(value) => setField('protein', value)}
            />
            <NumberField
              label={t('nutrition.fields.carbsGoal')}
              value={draft.carbs}
              onChangeText={(value) => setField('carbs', value)}
            />
            <NumberField
              label={t('nutrition.fields.fatGoal')}
              value={draft.fat}
              onChangeText={(value) => setField('fat', value)}
            />
          </View>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose} accessibilityRole="button">
              <Text style={s.modalCancelBtnText}>{t('nutrition.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSaveBtn} onPress={handleSave} accessibilityRole="button">
              <Text style={s.modalSaveBtnText}>{t('nutrition.saveGoals')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function NutritionScreen() {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<NutritionState>({ goals: { ...DEFAULT_GOALS }, days: {} });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ready, setReady] = useState(false);
  const [addFoodMeal, setAddFoodMeal] = useState<MealType | null>(null);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    loadNutrition()
      .then(setState)
      .finally(() => setReady(true));
  }, []);

  const dateKey = getDayKey(currentDate);
  const dayData = state.days[dateKey] ?? createEmptyDay();
  const daySum = sumDay(dayData);

  const persist = (newState: NutritionState) => {
    setState(newState);
    saveNutrition(newState).catch(() => {});
  };

  const handleSaveFood = (food: Omit<FoodEntry, 'id'>) => {
    if (!addFoodMeal) return;
    const currentDay = state.days[dateKey] ?? createEmptyDay();
    const newState: NutritionState = {
      ...state,
      days: {
        ...state.days,
        [dateKey]: {
          ...currentDay,
          [addFoodMeal]: [...currentDay[addFoodMeal], { ...food, id: generateId() }],
        },
      },
    };
    persist(newState);
  };

  const handleDeleteFood = (mealType: MealType, id: string) => {
    const currentDay = state.days[dateKey];
    if (!currentDay) return;
    persist({
      ...state,
      days: {
        ...state.days,
        [dateKey]: {
          ...currentDay,
          [mealType]: currentDay[mealType].filter((item) => item.id !== id),
        },
      },
    });
  };

  if (!ready) return <SafeAreaView style={s.screen} />;

  const dateText = currentDate.toLocaleDateString(i18n.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={s.dateHeader}>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))}
            accessibilityRole="button"
            accessibilityLabel={t('nutrition.previousDay')}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={s.dateContainer}>
            <Text style={s.dateText}>{dateText}</Text>
            {dateKey === getTodayKey() && <Text style={s.todayBadge}>{t('nutrition.today')}</Text>}
          </View>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))}
            accessibilityRole="button"
            accessibilityLabel={t('nutrition.nextDay')}>
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.macroGrid}>
          {MACROS.map((macro) => (
            <MacroCard
              key={macro.key}
              label={t(macro.labelKey)}
              current={daySum[macro.key]}
              goal={state.goals[macro.key]}
              unit={t(macro.unitKey)}
              color={macro.color}
              t={t}
            />
          ))}
        </View>

        <TouchableOpacity style={s.goalsBtn} onPress={() => setShowGoals(true)} accessibilityRole="button">
          <Text style={s.goalsBtnText}>{t('nutrition.editGoals')}</Text>
        </TouchableOpacity>

        {MEALS.map((meal) => (
          <MealSection
            key={meal.key}
            label={t(meal.labelKey)}
            items={dayData[meal.key]}
            onAdd={() => setAddFoodMeal(meal.key)}
            onDelete={(id) => handleDeleteFood(meal.key, id)}
            t={t}
          />
        ))}
      </ScrollView>

      <AddFoodModal
        visible={addFoodMeal !== null}
        onClose={() => setAddFoodMeal(null)}
        onSave={handleSaveFood}
        mealType={addFoodMeal}
        t={t}
      />
      <GoalsModal
        visible={showGoals}
        onClose={() => setShowGoals(false)}
        goals={state.goals}
        onSave={(goals) => persist({ ...state, goals })}
        t={t}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 20, gap: 16, paddingBottom: 60 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F3F5', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 28, lineHeight: 30, fontWeight: '600', color: '#333' },
  dateContainer: { flex: 1, alignItems: 'center', gap: 4 },
  dateText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  todayBadge: { fontSize: 11, fontWeight: '700', color: '#2B7A0B', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: '#F2F3F5', borderRadius: 14, padding: 14, gap: 6 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  macroLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  macroPct: { fontSize: 13, fontWeight: '700' },
  macroValue: { fontSize: 17, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#E0E0E0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  goalsBtn: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#F2F3F5', borderRadius: 10 },
  goalsBtnText: { fontSize: 14, fontWeight: '600', color: '#4C9AFF' },
  mealSection: { backgroundColor: '#F2F3F5', borderRadius: 14, padding: 16, gap: 10 },
  mealTitle: { fontSize: 17, fontWeight: '700' },
  mealSummary: { fontSize: 12, color: '#666' },
  emptyMeal: { fontSize: 14, color: '#777', textAlign: 'center', paddingVertical: 8 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '600' },
  foodDetails: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 18 },
  deleteBtn: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#C62828' },
  addFoodBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 10 },
  addFoodBtnText: { fontSize: 14, fontWeight: '600', color: '#2B7A0B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 22 },
  modalBody: { paddingTop: 16, gap: 16, paddingBottom: 8 },
  modalError: { fontSize: 13, color: '#C62828', textAlign: 'center' },
  inputGroup: { gap: 6 },
  inputGroupFlex: { flex: 1, gap: 6 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
  input: { height: 44, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D0D0', paddingHorizontal: 12, fontSize: 16 },
  formHint: { fontSize: 12, lineHeight: 18, color: '#666' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  modalCancelBtn: { flex: 1, minHeight: 44, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F2F3F5', alignItems: 'center' },
  modalCancelBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalSaveBtn: { flex: 1, minHeight: 44, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2B7A0B', alignItems: 'center' },
  modalSaveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
