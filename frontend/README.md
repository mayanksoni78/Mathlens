# MathLens Frontend

This directory contains the client-side single-page application (SPA) for **MathLens**, built with React 19, Vite, and Tailwind CSS v4.

---

## 📁 Source Code Organization

The `src/` directory is organized into clear architectural layers:

```text
src/
├── assets/          # Static media and brand icons
├── components/      # Cross-cutting UI components
│   ├── common/      # Generic atomic UI: Button, Slider, Card, Modal, Badge
│   ├── layout/      # Layout shells: Navbar, SplitPane, StepContainer
│   ├── math/        # Math UI: MatrixDisplay, FormulaViewer
│   └── canvas/      # Canvas rendering: PixelCanvas
├── config/          # Curriculum lesson specs and preset matrices
│   ├── curriculum.js
│   └── presets.js
├── context/         # React state providers
│   ├── UserLevelContext.jsx  # Basic vs Advanced learner state
│   └── ProgressContext.jsx   # Lesson tracking state
├── core/            # Framework-agnostic math & image engine
│   ├── math/        # Matrix math, transformations, scalar operations
│   └── image/       # Color channels, RGB split/recombine, canvas drawing
├── hooks/           # Custom React hooks (useMatrix, useDebounce)
├── modules/         # Feature-sliced educational modules
│   ├── onboarding/
│   └── pixels-to-matrices/  # Module 1 with all 7 interactive steps
├── screens/         # Page containers mapped to routes
│   ├── HomeScreen.jsx
│   ├── ModuleViewScreen.jsx
│   ├── SandboxScreen.jsx
│   └── NotFoundScreen.jsx
├── App.jsx          # Provider tree & React Router routes
├── main.jsx         # App bootstrap with BrowserRouter
└── index.css        # Tailwind CSS imports
```

---

## 🛠️ Development Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm run build` | Bundles the application for production in `dist/` |
| `npm run preview` | Locally previews production build |
| `npm run lint` | Runs Oxlint linter for code health and syntax checks |

---

## 🧭 Coding Conventions

1. **Pure Math in `src/core/`**: Keep mathematical formulas, matrix operations, and coordinate transformations inside `src/core/`. Do not embed heavy calculation logic directly into UI components.
2. **Side-by-Side Visuals with `<SplitPane />`**: When presenting an image and its matrix, always use `<SplitPane />` or responsive grid layouts to preserve the direct 1:1 visual correspondence.
3. **Adaptive Hints**: When writing step explanations, provide both `basicHint` and `advancedFormula` so the UI adapts based on user level.
