import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRICULUM } from '../config/curriculum.js';
import { PRESETS } from '../config/presets.js';
import { useUserLevel, USER_LEVELS } from '../context/UserLevelContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { PixelCanvas } from '../components/canvas/PixelCanvas.jsx';
import { MatrixDisplay } from '../components/math/MatrixDisplay.jsx';
import { scalarMultiply } from '../core/math/matrix.js';
import { toRgbString, toHex } from '../core/image/color.js';
import { transformImage, TransformMatrices } from '../core/math/transforms.js';

import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Binary,
  Layers,
  Palette,
  Maximize2,
  Cpu,
  Sliders,
  Play,
  RotateCw,
  CheckCircle2,
  BookOpen,
  Code2,
  Compass
} from 'lucide-react';

export function HomeScreen() {
  const { userLevel, setUserLevel, isAdvanced, setShowLevelModal } = useUserLevel();

  // -------------------------------------------------------------
  // HERO MICRO-LAB STATE (Live 4x4 matrix + scalar multiplier k)
  // -------------------------------------------------------------
  const [heroPresetKey, setHeroPresetKey] = useState('gradient');
  const [heroScalar, setHeroScalar] = useState(1.0);
  const [heroSelectedCell, setHeroSelectedCell] = useState([1, 1]);

  // Base matrix for hero
  const [heroBaseMatrix, setHeroBaseMatrix] = useState(PRESETS.grayscale4x4.gradient);

  // Scaled matrix: A' = k * A
  const heroComputedMatrix = useMemo(() => {
    return scalarMultiply(heroBaseMatrix, heroScalar, true);
  }, [heroBaseMatrix, heroScalar]);

  const handleHeroPreset = (key) => {
    setHeroPresetKey(key);
    setHeroScalar(1.0);
    if (key === 'black') setHeroBaseMatrix(PRESETS.grayscale4x4.black);
    else if (key === 'white') setHeroBaseMatrix(PRESETS.grayscale4x4.white);
    else if (key === 'checkerboard') setHeroBaseMatrix(PRESETS.grayscale4x4.checkerboard);
    else if (key === 'gradient') setHeroBaseMatrix(PRESETS.grayscale4x4.gradient);
    else if (key === 'letterL') {
      setHeroBaseMatrix([
        [255, 0, 0, 0],
        [255, 0, 0, 0],
        [255, 0, 0, 0],
        [255, 255, 255, 0]
      ]);
    }
  };

  const handleHeroCellCycle = (r, c) => {
    setHeroSelectedCell([r, c]);
    const nextVal = (heroBaseMatrix[r][c] + 50) % 300;
    const clampedVal = nextVal > 255 ? 0 : nextVal;
    const nextMatrix = heroBaseMatrix.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? clampedVal : val))
    );
    setHeroBaseMatrix(nextMatrix);
  };

  // -------------------------------------------------------------
  // CONFERENCE DEMO STATION STATE (Multi-Tab Live Playground)
  // -------------------------------------------------------------
  const [activeDemoTab, setActiveDemoTab] = useState('scalar'); // 'matrix', 'scalar', 'rgb', 'transform'

  // Tab 1: Grayscale Editor
  const [demoMatrix, setDemoMatrix] = useState([
    [0, 50, 100, 150],
    [50, 100, 150, 200],
    [100, 150, 200, 255],
    [150, 200, 255, 255]
  ]);
  const [demoSelectedCell, setDemoSelectedCell] = useState([1, 1]);

  // Tab 2: Scalar Multiplication
  const [demoScalarK, setDemoScalarK] = useState(1.5);
  const demoScalarResult = useMemo(() => {
    return scalarMultiply(demoMatrix, demoScalarK, true);
  }, [demoMatrix, demoScalarK]);

  // Tab 3: RGB Color Vector
  const [demoR, setDemoR] = useState(128);
  const [demoG, setDemoG] = useState(0);
  const [demoB, setDemoB] = useState(128); // Default to Purple [128, 0, 128]

  // Tab 4: Coordinate Transformations
  const [demoTransformType, setDemoTransformType] = useState('rotate45');
  const demoTransformMatrix = useMemo(() => {
    switch (demoTransformType) {
      case 'identity':
        return TransformMatrices.identity();
      case 'rotate45':
        return TransformMatrices.rotate(45);
      case 'rotate90':
        return TransformMatrices.rotate(90);
      case 'shearX':
        return TransformMatrices.shearX(0.5);
      case 'scaleHalf':
        return TransformMatrices.scale(0.65);
      case 'reflectY':
        return TransformMatrices.reflectY();
      default:
        return TransformMatrices.identity();
    }
  }, [demoTransformType]);

  const demoTransformedArrow = useMemo(() => {
    return transformImage(PRESETS.grayscale8x8.arrow, demoTransformMatrix);
  }, [demoTransformMatrix]);

  return (
    <div className="space-y-16 pb-16">
      {/* --------------------------------------------------------- */}
      {/* 1. ACADEMIC CONFERENCE HEADER & TRACK STATUS BANNER      */}
      {/* --------------------------------------------------------- */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-indigo-50/60 via-white to-transparent dark:from-indigo-950/20 dark:via-gray-950 dark:to-transparent pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">MathLens Research Demo</span> &bull; 
                Linear Algebra in Digital Computer Vision &bull; 2026 Academic Edition
              </div>
            </div>

            {/* Learner Track Switcher Pill */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                Learner Track:
              </span>
              <button
                onClick={() => setUserLevel(USER_LEVELS.BASIC)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userLevel === USER_LEVELS.BASIC
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🌱 Basic</span>
              </button>
              <button
                onClick={() => setUserLevel(USER_LEVELS.ADVANCED)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userLevel === USER_LEVELS.ADVANCED
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>⚡ Advanced</span>
              </button>
              <button
                onClick={() => setShowLevelModal(true)}
                className="text-[11px] text-gray-400 hover:text-indigo-600 px-1 font-medium underline cursor-pointer"
                title="Explain track differences"
              >
                Help?
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ------------------------------------------------------- */}
        {/* 2. HERO SECTION WITH LIVE INTERACTIVE MICRO-LAB          */}
        {/* ------------------------------------------------------- */}
        <section className="relative pt-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Title & Mission */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Module 1: From Pixels to Matrices</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-950 dark:text-gray-50 leading-[1.1]">
                See Linear Algebra Through the Lens of{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
                  Digital Pixels
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Transform abstract matrix arithmetic into an intuitive visual playground.
                Discover how every photograph is an array of numbers, scale image brightness using
                scalar multiplication (<code className="font-mono text-xs bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">A&apos; = kA</code>),
                decompose colors into RGB tensor planes, and warp images through coordinate transformation matrices (<code className="font-mono text-xs bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">X&apos; = AX</code>).
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/learn/pixels-to-matrices">
                  <Button size="lg" variant="primary" className="shadow-lg shadow-indigo-500/20 text-sm font-bold flex items-center gap-2">
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start 7-Step Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link to="/sandbox">
                  <Button size="lg" variant="outline" className="text-sm font-bold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>Open Interactive Sandbox</span>
                  </Button>
                </Link>
              </div>

              {/* Track Insight Tag */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAdvanced ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                  {isAdvanced ? <Binary className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    Active Mode: {isAdvanced ? '⚡ Advanced (Formal Mathematical Rigor)' : '🌱 Basic (Visual Conceptual Intuition)'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {isAdvanced
                      ? 'Displaying vector space notation (ℝ³), 3D tensors (H×W×C), and linear maps X\'=AX.'
                      : 'Displaying visual lightbulb analogies, simple color sliders, and clear step-by-step guidance.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Hero Micro-Lab */}
            <div className="lg:col-span-6">
              <div className="bg-white dark:bg-gray-900 border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                {/* Glow Backdrop Accent */}
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        Live Matrix-to-Pixel Micro-Lab
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Click matrix cells or drag scalar <strong>k</strong> to observe instant pixel feedback!
                    </p>
                  </div>
                  <Badge variant="indigo" className="text-[10px]">Interactive Demo</Badge>
                </div>

                {/* Preset selector bar */}
                <div className="flex flex-wrap items-center gap-1.5 mb-5 text-xs">
                  <span className="font-semibold text-gray-400 text-[11px] mr-1">Presets:</span>
                  {[
                    { id: 'gradient', label: 'Gradient' },
                    { id: 'black', label: 'All 0 (Black)' },
                    { id: 'white', label: 'All 255 (White)' },
                    { id: 'checkerboard', label: 'Checkerboard' },
                    { id: 'letterL', label: "Letter 'L'" }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleHeroPreset(p.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        heroPresetKey === p.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Dual-Pane: Pixel Canvas + Matrix Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center justify-items-center bg-gray-50/70 dark:bg-gray-950/60 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800">
                  {/* Digital Image (Canvas) */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Digital Image (4×4 Pixels)
                    </span>
                    <PixelCanvas
                      matrix={heroComputedMatrix}
                      pixelScale={36}
                      showGrid={true}
                      onPixelClick={(r, c) => handleHeroCellCycle(r, c)}
                    />
                    <span className="text-[10px] text-gray-400 mt-1">
                      (Click any pixel to cycle value)
                    </span>
                  </div>

                  {/* Numerical Matrix */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Matrix <span className="font-mono text-indigo-600 dark:text-indigo-400">A&apos; = {heroScalar.toFixed(1)}A</span>
                    </span>
                    <MatrixDisplay
                      matrix={heroComputedMatrix}
                      selectedCell={heroSelectedCell}
                      onCellClick={(r, c) => handleHeroCellCycle(r, c)}
                    />
                    <span className="text-[10px] text-gray-400 mt-1">
                      (Click cell to add +50)
                    </span>
                  </div>
                </div>

                {/* Live Scalar Multiplier Slider */}
                <div className="mt-5 p-4 rounded-xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Scalar Multiplier <code className="font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">k = {heroScalar.toFixed(2)}</code>
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {heroScalar > 1 ? '✨ Brightening (k > 1)' : heroScalar < 1 ? '🌑 Darkening (k < 1)' : 'Original (k = 1.0)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={heroScalar}
                    onChange={(e) => setHeroScalar(parseFloat(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>0.2× (Dim)</span>
                    <span>1.0× (Identity)</span>
                    <span>2.0× (Bright / Clipped to 255)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* 3. CORE 7-STEP CURRICULUM ARCHITECTURE                   */}
        {/* ------------------------------------------------------- */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Pedagogical Sequence</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Curriculum: From Pixels to Matrices
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                A systematically engineered 7-step progression establishing the foundational mathematical bridge
                between visual pixels and linear algebra.
              </p>
            </div>
            <Link to="/learn/pixels-to-matrices">
              <Button variant="primary" size="sm" className="font-bold flex items-center gap-1.5">
                <span>Begin Module 1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Grid of 7 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CURRICULUM.steps.map((step) => {
              return (
                <div
                  key={step.id}
                  className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Step Badge + Number */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {step.id}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Step {step.id}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                        4×4 &bull; 8×8
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {step.title.replace(/^Step \d+:\s*/, '')}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {step.summary}
                    </p>

                    {/* Core Mathematical / Pedagogical Insight */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 text-xs mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                        {isAdvanced ? <Binary className="w-3 h-3 text-indigo-500" /> : <GraduationCap className="w-3 h-3 text-emerald-500" />}
                        <span>{isAdvanced ? 'Formal Mathematical Formulation' : 'Intuitive Learning Takeaway'}</span>
                      </div>
                      <div className="font-mono text-xs text-gray-800 dark:text-gray-200 font-semibold">
                        {isAdvanced ? step.advancedFormula : step.basicHint}
                      </div>
                    </div>

                    {/* Concept Badges */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {step.concepts.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Link to Step */}
                  <Link
                    to={`/learn/pixels-to-matrices?step=${step.id}`}
                    className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Launch Step {step.id} Live</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}

            {/* Final Showcase Card: Full Sandbox */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-violet-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-400/30">
                  <Compass className="w-3 h-3" />
                  <span>Free Exploration Lab</span>
                </div>
                <h3 className="text-xl font-extrabold mb-2">
                  Interactive Matrix Sandbox
                </h3>
                <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                  Test arbitrary matrix dimensions, edit individual cell values from 0 to 255 with full precision,
                  and inspect real-time raster rendering.
                </p>
                <div className="space-y-1.5 text-xs text-indigo-200 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Side-by-side editable matrix brackets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-time pixel canvas synchronizer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Custom presets &amp; threshold testing</span>
                  </div>
                </div>
              </div>

              <Link to="/sandbox" className="mt-6">
                <Button variant="secondary" className="w-full font-bold text-xs py-2.5">
                  Launch Free Sandbox →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* 4. EMBEDDED CONFERENCE DEMO STATION (Multi-Tab Showcase) */}
        {/* ------------------------------------------------------- */}
        <section className="bg-white dark:bg-gray-900 border-2 border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase">
                  Conference Station
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Live Demonstration Station
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Demonstrate the core mathematical mechanisms live on stage with instantaneous visual rendering.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
              {[
                { id: 'matrix', label: '1. Grayscale Elements', icon: Binary },
                { id: 'scalar', label: '2. Scalar Brightness (kA)', icon: Sliders },
                { id: 'rgb', label: '3. RGB Color Vector', icon: Palette },
                { id: 'transform', label: '4. Transforms (X\'=AX)', icon: RotateCw }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemoTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDemoTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: Grayscale Elements */}
          {activeDemoTab === 'matrix' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Step 1 &amp; 2: Numerical Matrix &harr; Digital Pixels
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Every pixel on a display is represented as a scalar integer <code className="font-mono font-bold">0 &le; val &le; 255</code>.
                  Select any cell in the matrix below to adjust its value and watch the corresponding pixel update immediately.
                </p>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      Cell [{demoSelectedCell[0]}, {demoSelectedCell[1]}] Value:
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {demoMatrix[demoSelectedCell[0]][demoSelectedCell[1]]} / 255
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={demoMatrix[demoSelectedCell[0]][demoSelectedCell[1]]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = demoMatrix.map((row, r) =>
                        row.map((v, c) => (r === demoSelectedCell[0] && c === demoSelectedCell[1] ? val : v))
                      );
                      setDemoMatrix(updated);
                    }}
                    className="w-full cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between gap-1 pt-1">
                    {[0, 50, 100, 150, 200, 255].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const updated = demoMatrix.map((row, r) =>
                            row.map((val, c) => (r === demoSelectedCell[0] && c === demoSelectedCell[1] ? v : val))
                          );
                          setDemoMatrix(updated);
                        }}
                        className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-indigo-50"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-gray-500">
                  Takeaway: <strong>A digital image is a numerical array.</strong> 0 = Pitch Black, 255 = Pure White.
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-wrap items-center justify-center gap-6 bg-gray-50/70 dark:bg-gray-950/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-500 mb-3 uppercase">Digital Image</span>
                  <PixelCanvas
                    matrix={demoMatrix}
                    pixelScale={42}
                    onPixelClick={(r, c) => setDemoSelectedCell([r, c])}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-500 mb-3 uppercase">Matrix A</span>
                  <MatrixDisplay
                    matrix={demoMatrix}
                    selectedCell={demoSelectedCell}
                    onCellClick={(r, c) => setDemoSelectedCell([r, c])}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Scalar Brightness */}
          {activeDemoTab === 'scalar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Step 3: Scalar Multiplication &amp; Image Brightness (A&apos; = kA)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Multiplying an image matrix <code className="font-mono font-bold">A</code> by a scalar <code className="font-mono font-bold">k</code> amplifies
                  or dims all pixel intensities simultaneously. When <code className="font-mono font-bold">k &gt; 1</code>, the image brightens; when <code className="font-mono font-bold">k &lt; 1</code>, it darkens. Values exceeding 255 are clipped.
                </p>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Scalar Multiplier:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                      k = {demoScalarK.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={demoScalarK}
                    onChange={(e) => setDemoScalarK(parseFloat(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>0.2× (Darken)</span>
                    <span>1.0× (Normal)</span>
                    <span>2.0× (Brighten & Clip)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 font-mono">
                  A&apos; = min(255, round({demoScalarK.toFixed(2)} &times; A))
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-wrap items-center justify-center gap-6 bg-gray-50/70 dark:bg-gray-950/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-500 mb-2 uppercase">Original Image</span>
                  <PixelCanvas matrix={demoMatrix} pixelScale={34} />
                  <span className="text-[11px] font-mono text-gray-400 mt-1">Matrix A</span>
                </div>

                <div className="text-xl font-bold text-indigo-600">&times; {demoScalarK.toFixed(1)} &rarr;</div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-500 mb-2 uppercase">Scaled Image</span>
                  <PixelCanvas matrix={demoScalarResult} pixelScale={34} />
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 font-bold">
                    A&apos; = {demoScalarK.toFixed(1)}A
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RGB Color Vector */}
          {activeDemoTab === 'rgb' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Step 4: Vector Pixels &amp; Additive Color Mixing
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  A color pixel is represented by a 3-component vector <code className="font-mono font-bold">[R, G, B]ᵀ</code>.
                  Each channel takes an intensity from 0 to 255.
                  For instance, <strong>Purple</strong> is formed by combining Red and Blue: <code className="font-mono font-bold">[128, 0, 128]</code>!
                </p>

                {/* Sliders */}
                <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-red-600">
                      <span>Red (R):</span>
                      <span className="font-mono">{demoR}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={demoR}
                      onChange={(e) => setDemoR(parseInt(e.target.value, 10))}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-green-600">
                      <span>Green (G):</span>
                      <span className="font-mono">{demoG}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={demoG}
                      onChange={(e) => setDemoG(parseInt(e.target.value, 10))}
                      className="w-full accent-green-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-blue-600">
                      <span>Blue (B):</span>
                      <span className="font-mono">{demoB}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={demoB}
                      onChange={(e) => setDemoB(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Color Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 mr-1">Presets:</span>
                  {[
                    { label: 'Purple', rgb: [128, 0, 128] },
                    { label: 'Pure Red', rgb: [255, 0, 0] },
                    { label: 'Pure Green', rgb: [0, 255, 0] },
                    { label: 'Pure Blue', rgb: [0, 0, 255] },
                    { label: 'Yellow', rgb: [255, 255, 0] },
                    { label: 'Cyan', rgb: [0, 255, 255] }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setDemoR(preset.rgb[0]);
                        setDemoG(preset.rgb[1]);
                        setDemoB(preset.rgb[2]);
                      }}
                      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-[11px] font-semibold cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live RGB Swatch & Vector Box */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 space-y-4">
                <div
                  className="w-36 h-36 rounded-2xl shadow-xl border-4 border-white dark:border-gray-800 transition-all transform hover:scale-105"
                  style={{ backgroundColor: toRgbString([demoR, demoG, demoB]) }}
                />
                <div className="text-center space-y-1">
                  <div className="text-lg font-mono font-black text-gray-900 dark:text-gray-100">
                    p = [{demoR}, {demoG}, {demoB}]ᵀ
                  </div>
                  <div className="text-xs font-mono text-gray-400">
                    Hex: {toHex([demoR, demoG, demoB]).toUpperCase()} &bull; CSS: {toRgbString([demoR, demoG, demoB])}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Coordinate Transformations */}
          {activeDemoTab === 'transform' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Step 7: Linear Coordinate Transformations (X&apos; = AX)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Moving pixel coordinates transforms the image! Every pixel at coordinate vector <code className="font-mono font-bold">[x, y]ᵀ</code> is
                  mapped to a new position <code className="font-mono font-bold">X&apos; = A &bull; X</code> where <code className="font-mono font-bold">A</code> is a 2&times;2 transformation matrix.
                </p>

                {/* Transform Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Select Transformation Operator A:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'identity', label: 'Identity (A = I)' },
                      { id: 'rotate45', label: 'Rotate 45°' },
                      { id: 'rotate90', label: 'Rotate 90°' },
                      { id: 'shearX', label: 'Shear X (k=0.5)' },
                      { id: 'scaleHalf', label: 'Scale (0.65×)' },
                      { id: 'reflectY', label: 'Horizontal Flip' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setDemoTransformType(t.id)}
                        className={`p-2 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                          demoTransformType === t.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matrix values display */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-500">2×2 Matrix A:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    [{demoTransformMatrix[0].join(', ')}] ; [{demoTransformMatrix[1].join(', ')}]
                  </span>
                </div>
              </div>

              {/* Side-by-Side: Original Arrow vs. Transformed Arrow */}
              <div className="lg:col-span-7 flex flex-wrap items-center justify-center gap-6 bg-gray-50/70 dark:bg-gray-950/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-500 mb-2 uppercase">Original Shape (8×8)</span>
                  <PixelCanvas matrix={PRESETS.grayscale8x8.arrow} pixelScale={24} />
                  <span className="text-[11px] font-mono text-gray-400 mt-1">Coordinate X</span>
                </div>

                <div className="text-xl font-bold text-indigo-600">&rarr; X&apos; = AX &rarr;</div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase">Transformed Shape</span>
                  <PixelCanvas matrix={demoTransformedArrow} pixelScale={24} />
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 font-bold">
                    Coordinate X&apos;
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- */}
        {/* 5. COMPUTER VISION & MATHEMATICAL FOUNDATIONS           */}
        {/* ------------------------------------------------------- */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              Why Linear Algebra for Digital Images?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Every modern computer vision model, graphics engine, and image processing pipeline
              is anchored in the foundational linear algebra explored throughout MathLens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                1. Digital Images as Tensors
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Images are not visual files; they are discrete 2D and 3D numerical tensors.
                Understanding raster grids as matrices unlocks mathematical manipulation from basic contrast adjustments
                to deep convolutional neural networks (CNNs).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                2. Operations as Matrix Math
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Scalar multiplication scales brightness (<code className="font-mono text-[11px]">A&apos; = kA</code>).
                Matrix addition blends layers. Kernel convolutions detect edges and blur noise.
                All image processing is linear algebra in action.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Maximize2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                3. Spatial Warps as Linear Maps
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Rotations, affine translations, camera projections, and perspective transformations
                are computed by applying transformation matrices (<code className="font-mono text-[11px]">X&apos; = AX</code>) to pixel coordinates.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* 6. EXTENSIBLE MODULAR ROADMAP                            */}
        {/* ------------------------------------------------------- */}
        <section className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Platform Extensibility &amp; Roadmap
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Future modules extending the foundational matrix curriculum to advanced vision topics.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
              Modular Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CURRICULUM.upcomingModules.map((mod) => (
              <div
                key={mod.id}
                className="p-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {mod.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      {mod.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-400">
                  Coming Next in v2.0
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* 7. CONFERENCE PRESENTATION FOOTER & CITATION METADATA   */}
        {/* ------------------------------------------------------- */}
        <section className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Conference Presentation Tips</span>
            </div>
            <p className="text-indigo-800 dark:text-indigo-300 text-[11px]">
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded font-mono">F11</kbd> to enter full-screen projector view. Toggle between 🌱 Basic and ⚡ Advanced at any time during your talk to adapt to the audience.
            </p>
          </div>
          <Link to="/learn/pixels-to-matrices">
            <Button variant="primary" size="sm" className="font-bold whitespace-nowrap">
              Begin Live Presentation →
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default HomeScreen;
