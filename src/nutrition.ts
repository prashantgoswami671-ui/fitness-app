import AsyncStorage from '@react-native-async-storage/async-storage';

export type FoodEntry = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type DayNutrition = {
  breakfast: FoodEntry[];
  lunch: FoodEntry[];
  dinner: FoodEntry[];
  snacks: FoodEntry[];
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionState = {
  goals: NutritionGoals;
  days: Record<string, DayNutrition>;
};

export const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
};

const STORAGE_KEY = 'fitness-nutrition';

export function createEmptyDay(): DayNutrition {
  return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

export async function loadNutrition(): Promise<NutritionState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        goals: { ...DEFAULT_GOALS, ...parsed.goals },
        days: parsed.days ?? {},
      };
    }
  } catch {
    // Use defaults if stored nutrition data is unavailable or invalid.
  }
  return { goals: { ...DEFAULT_GOALS }, days: {} };
}

export async function saveNutrition(state: NutritionState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return getDayKey(new Date());
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sumMeal(meal: FoodEntry[]): { calories: number; protein: number; carbs: number; fat: number } {
  return meal.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function sumDay(day: DayNutrition): { calories: number; protein: number; carbs: number; fat: number } {
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
  return meals.reduce(
    (acc, mealType) => {
      const mealSum = sumMeal(day[mealType]);
      return {
        calories: acc.calories + mealSum.calories,
        protein: acc.protein + mealSum.protein,
        carbs: acc.carbs + mealSum.carbs,
        fat: acc.fat + mealSum.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}