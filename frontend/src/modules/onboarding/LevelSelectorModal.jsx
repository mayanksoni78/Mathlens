import { Modal } from '../../components/common/Modal.jsx';
import { useUserLevel, USER_LEVELS } from '../../context/UserLevelContext.jsx';
import { Sparkles, GraduationCap, Binary, ArrowRight, CheckCircle2 } from 'lucide-react';

export function LevelSelectorModal() {
  const { showLevelModal, setShowLevelModal, setUserLevel, userLevel } = useUserLevel();

  const handleSelect = (level) => {
    setUserLevel(level);
  };

  return (
    <Modal
      isOpen={showLevelModal}
      onClose={userLevel ? () => setShowLevelModal(false) : null}
      title=""
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 pt-2 pb-1">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to MathLens • Conference & Education Edition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Choose Your Learning Track
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Select how you would like to explore linear algebra and digital image processing.
            MathLens adapts explanations, formulas, and tooltips to your background.
          </p>
        </div>

        {/* 2 Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Basic Track Card */}
          <div
            onClick={() => handleSelect(USER_LEVELS.BASIC)}
            className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg ${
              userLevel === USER_LEVELS.BASIC
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            {userLevel === USER_LEVELS.BASIC && (
              <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-5 h-5 fill-indigo-100 dark:fill-indigo-900" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  🌱 Basic Track
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Intuitive
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-3">
                Visual exploration and intuitive analogies without math anxiety.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Grid Metaphors:</strong> Lightbulb arrays, brightness levels (0=black, 255=white).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Color Mixing:</strong> Intuitive RGB sliders (e.g. Red + Blue = Purple).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Step-by-Step:</strong> Guided interactive explanations for every step.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                userLevel === USER_LEVELS.BASIC
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 group-hover:bg-indigo-600 group-hover:text-white'
              }`}
            >
              <span>{userLevel === USER_LEVELS.BASIC ? 'Selected (Active)' : 'Choose Basic Track'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Advanced Track Card */}
          <div
            onClick={() => handleSelect(USER_LEVELS.ADVANCED)}
            className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg ${
              userLevel === USER_LEVELS.ADVANCED
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            {userLevel === USER_LEVELS.ADVANCED && (
              <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-5 h-5 fill-indigo-100 dark:fill-indigo-900" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Binary className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  ⚡ Advanced Track
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Rigorous
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-3">
                Formal mathematical formalism, vector spaces, and linear mapping.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Vector Spaces:</strong> Pixel vectors <code className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-1 rounded">p ∈ ℝ³</code> and 3D image tensors.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Matrix Algebra:</strong> Scalar scaling <code className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-1 rounded">A&apos; = kA</code> and range clipping.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Coordinate Transforms:</strong> Linear mapping <code className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-1 rounded">X&apos; = AX</code>, rotation & shear.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                userLevel === USER_LEVELS.ADVANCED
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 group-hover:bg-indigo-600 group-hover:text-white'
              }`}
            >
              <span>{userLevel === USER_LEVELS.ADVANCED ? 'Selected (Active)' : 'Choose Advanced Track'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔄 You can toggle between tracks at any time via the top navigation bar or the home page.
          </p>
        </div>
      </div>
    </Modal>
  );
}
