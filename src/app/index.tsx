import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Ex = [name: string, tier: 'S' | 'A' | 'B', reason: string];
type Target = { sets: number; reps: number; weight: number };
type Session = { date: string; weight: number; target: number; actual: number[] };
type Saved = {
  picked: Record<string, string[]>;
  targets: Record<string, Target>;
  history: Record<string, Session[]>;
};

const SPLITS: Record<string, Record<string, Ex[]>> = {
  'Push / Pull / Legs': {
    Push: [
      ['Incline Dumbbell Press', 'S', 'Great upper chest stimulus'],
      ['Flat Barbell Bench Press', 'S', 'Heavy compound for chest and triceps'],
      ['Cable Lateral Raise', 'A', 'Constant tension on side delts'],
      ['Overhead Triceps Extension', 'A', 'Stretches the long head of the triceps'],
      ['Push-ups', 'B', 'Convenient but hard to load'],
    ],
    Pull: [
      ['Lat Pulldown', 'S', 'Easy to load, strong lat stimulus'],
      ['Chest-Supported Row', 'S', 'Targets back with little lower-back fatigue'],
      ['Incline Dumbbell Curl', 'A', 'Biceps worked in a stretched position'],
      ['Face Pull', 'A', 'Rear delts and shoulder health'],
      ['Barbell Curl', 'B', 'Solid, but less stretch on the biceps'],
    ],
    Legs: [
      ['Squat', 'S', 'Big quad and glute builder'],
      ['Romanian Deadlift', 'S', 'Strong hamstring stretch'],
      ['Leg Press', 'A', 'Heavy quad work with low technique demand'],
      ['Seated Leg Curl', 'A', 'Direct hamstring isolation'],
      ['Standing Calf Raise', 'B', 'Basic calf work'],
    ],
  },
  'Upper / Lower': {
    Upper: [
      ['Incline Dumbbell Press', 'S', 'Great upper chest stimulus'],
      ['Lat Pulldown', 'S', 'Strong lat stimulus'],
      ['Seated Cable Row', 'A', 'Mid-back thickness'],
      ['Cable Lateral Raise', 'A', 'Side delts'],
      ['Dumbbell Curl', 'B', 'Basic biceps work'],
    ],
    Lower: [
      ['Squat', 'S', 'Big quad and glute builder'],
      ['Romanian Deadlift', 'S', 'Strong hamstring stretch'],
      ['Leg Press', 'A', 'Heavy quad work'],
      ['Leg Curl', 'A', 'Hamstring isolation'],
      ['Calf Raise', 'B', 'Basic calf work'],
    ],
  },
};

const TIER_COLOR = { S: '#E8B400', A: '#4C9AFF', B: '#8A8F98' };
const DEFAULT_TARGET: Target = { sets: 3, reps: 8, weight: 20 };
const REP_MAX = 12;
const WEIGHT_STEP = 2.5;

// Double progression: fill the rep range, then add weight.
function suggest(t: Target, actual: number[]): { next: Target; message: string } {
  if (actual.every((r) => r >= REP_MAX)) {
    const w = t.weight + WEIGHT_STEP;
    return {
      next: { ...t, reps: 8, weight: w },
      message: `You hit ${REP_MAX} reps on every set. Add weight: ${w} kg, back to 8 reps.`,
    };
  }
  if (actual.every((r) => r >= t.reps)) {
    const r = Math.min(t.reps + 1, REP_MAX);
    return {
      next: { ...t, reps: r },
      message: `Target hit on every set. Stay at ${t.weight} kg and aim for ${r} reps next time.`,
    };
  }
  return {
    next: t,
    message: `You got ${actual.join(', ')}. Stay at ${t.weight} kg and aim for ${t.reps} reps on every set.`,
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
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
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

function ExerciseCard(props: {
  name: string;
  target: Target;
  last?: Session;
  onTarget: (t: Target) => void;
  onSave: (actual: number[]) => string;
}) {
  const { name, target, last, onTarget, onSave } = props;
  const [inputs, setInputs] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  const save = () => {
    const actual = Array.from({ length: target.sets }, (_, i) => parseInt(inputs[i] ?? '', 10));
    if (actual.some((n) => !n || n < 1)) {
      setMsg('Enter the reps for every set first.');
      return;
    }
    setMsg(onSave(actual));
    setInputs([]);
  };

  return (
    <View style={s.logCard}>
      <Text style={s.cardText}>{name}</Text>
      {last && (
        <Text style={s.sub}>
          Last time: {last.weight} kg x {last.actual.join(', ')} (target {last.target})
        </Text>
      )}

      <Text style={s.section}>
        Target: {target.sets} x {target.reps} at {target.weight} kg
      </Text>
      <Stepper label="Sets" value={target.sets} step={1} min={1} onChange={(v) => onTarget({ ...target, sets: v })} />
      <Stepper label="Reps" value={target.reps} step={1} min={1} onChange={(v) => onTarget({ ...target, reps: v })} />
      <Stepper label="Kg" value={target.weight} step={WEIGHT_STEP} min={0} onChange={(v) => onTarget({ ...target, weight: v })} />

      <Text style={s.section}>What you actually did</Text>
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
        <Text style={s.primaryText}>Save sets</Text>
      </TouchableOpacity>
      {msg !== '' && <Text style={s.msg}>{msg}</Text>}
    </View>
  );
}

export default function Home() {
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

  const toggle = (name: string) =>
    setPicked((p) => {
      const cur = p[key] ?? [];
      return { ...p, [key]: cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name] };
    });

  const saveSession = (name: string, actual: number[]) => {
    const t = targets[name] ?? DEFAULT_TARGET;
    const { next, message } = suggest(t, actual);
    const session: Session = {
      date: new Date().toISOString().slice(0, 10),
      weight: t.weight,
      target: t.reps,
      actual,
    };
    setHistory((h) => ({ ...h, [name]: [...(h[name] ?? []), session] }));
    setTargets((x) => ({ ...x, [name]: next }));
    return message;
  };

  const back = () => {
    if (logging) setLogging(false);
    else if (day) setDay(null);
    else setSplit(null);
  };

  if (!ready) return <SafeAreaView style={s.screen} />;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {split && (
          <TouchableOpacity onPress={back}>
            <Text style={s.back}>{'< Back'}</Text>
          </TouchableOpacity>
        )}

        {!split && (
          <>
            <Text style={s.title}>Choose your split</Text>
            {Object.keys(SPLITS).map((name) => (
              <TouchableOpacity key={name} style={s.card} onPress={() => setSplit(name)}>
                <Text style={s.cardText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {split && !day && (
          <>
            <Text style={s.title}>{split}</Text>
            {Object.keys(SPLITS[split]).map((d) => (
              <TouchableOpacity key={d} style={s.card} onPress={() => setDay(d)}>
                <View>
                  <Text style={s.cardText}>{d} day</Text>
                  <Text style={s.sub}>{(picked[`${split}|${d}`] ?? []).length} exercises picked</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {split && day && !logging && (
          <>
            <Text style={s.title}>{day} day</Text>
            <Text style={s.sub}>Tap to pick your exercises</Text>
            {(['S', 'A', 'B'] as const).map((tier) =>
              SPLITS[split][day]
                .filter((e) => e[1] === tier)
                .map(([name, , reason]) => {
                  const on = pickedNow.includes(name);
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[s.card, on && s.cardOn]}
                      onPress={() => toggle(name)}
                    >
                      <View style={[s.badge, { backgroundColor: TIER_COLOR[tier] }]}>
                        <Text style={s.badgeText}>{tier}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardText}>{name}</Text>
                        <Text style={s.sub}>{reason}</Text>
                      </View>
                      <Text style={s.check}>{on ? '✓' : ''}</Text>
                    </TouchableOpacity>
                  );
                })
            )}
            {pickedNow.length > 0 && (
              <TouchableOpacity style={s.primary} onPress={() => setLogging(true)}>
                <Text style={s.primaryText}>Start workout ({pickedNow.length})</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {split && day && logging && (
          <>
            <Text style={s.title}>{day} workout</Text>
            {pickedNow.map((name) => (
              <ExerciseCard
                key={name}
                name={name}
                target={targets[name] ?? DEFAULT_TARGET}
                last={(history[name] ?? []).slice(-1)[0]}
                onTarget={(t) => setTargets((x) => ({ ...x, [name]: t }))}
                onSave={(actual) => saveSession(name, actual)}
              />
            ))}
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
  section: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepLabel: { width: 40, fontSize: 14, color: '#444' },
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
});