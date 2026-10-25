# Fitness App: Agent Rules

## Project
A mobile fitness app. Users pick a workout split, choose exercises ranked by tier (S/A/B),
log sets against targets, and get next-target suggestions using double progression.
Planned later: multilingual form guides, nutrition tracking, educational videos.

## Tech stack
- Expo SDK 57 with Expo Router (routes live in `src/app`), TypeScript, React Compiler enabled
- Storage: `@react-native-async-storage/async-storage` (key: `fitness-state`)
- Tested in Expo Go on an Android emulator

## Rules
- Make only the changes the task asks for. Do not refactor or restyle unrelated code.
- Never delete or rename existing saved-data keys or shapes. Saved data (`picked`, `targets`,
  `history`) must keep working for existing users. If a shape must change, write a migration.
- Install packages with `npx expo install <package>` so versions match SDK 57.
- Do not run `npm audit fix --force`. Do not upgrade the Expo SDK.
- Keep all user-facing text out of components once i18n exists. Use translation keys.
- No `localStorage`. Use AsyncStorage.
- After changes, make sure `npx tsc --noEmit` passes and the app still starts.
- Explain what you changed in a short list at the end.

## Current state
- Routing: root Stack in `src/app/_layout.tsx` (initializes i18n before rendering) with a `(tabs)` group and `guide/[id]`.
- `src/app/(tabs)/index.tsx`: split picker, day picker, exercise picker by tier, workout logging
  with steppers, double progression (`suggest`, rep range 8-12, weight step 2.5 kg), Guide button.
- `src/app/guide/[id].tsx`: exercise guide screen.
- i18n: `src/i18n.ts`, translations in `src/locales/` (en, hi, es). All UI text uses translation keys.
- Saved data keys use English exercise names for backward compatibility. Do not change them.