# FORGE — React Frontend

AI-powered personal fitness PWA, converted from single-file HTML to React/Vite for Lovable.

## Stack
- React 18 + Vite
- Supabase auth
- Railway backend (Node.js/Express)

## Setup
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run build
# deploy dist/ to GitHub Pages
```

## Structure
```
src/
  App.jsx              — main shell, routing, overlays
  main.jsx             — entry point
  components/          — shared UI components
    AuthScreen.jsx
    OnboardingScreen.jsx
    BottomNav.jsx
    ExerciseModal.jsx
    UpgradeSheet.jsx
    TrialBanner.jsx
  panels/              — main app panels
    CoachPanel.jsx
    WorkoutPanel.jsx
    LogPanel.jsx
    NutritionPanel.jsx
    ProgressPanel.jsx
    AccountPanel.jsx
    AdminPanel.jsx
    ProgrammesPanel.jsx
  hooks/
    AppContext.jsx      — global state
    useAuth.js          — auth flow
  lib/
    api.js              — fetch wrapper
    constants.js        — config values
    theme.js            — theme system
    subscription.js     — tier logic
  styles/
    global.css          — all design tokens + CSS
```
