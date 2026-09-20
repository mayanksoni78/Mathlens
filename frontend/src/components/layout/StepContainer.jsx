import { useUserLevel } from '../../context/UserLevelContext.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export function StepContainer({
  step,
  children,
  onPrevious,
  onNext,
  isFirst,
  isLast,
  controls
}) {
  const { isAdvanced } = useUserLevel();

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {step.id}
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {step.title}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {step.concepts?.map((c) => (
              <Badge key={c} variant="indigo">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {step.summary}
        </p>

        {/* Adaptive Hint or Advanced Formula Bar */}
        <div className="rounded-lg p-3 text-xs border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-start gap-2">
          <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
            {isAdvanced ? 'Math Rigor:' : 'Key Intuition:'}
          </span>
          <span className="text-indigo-950 dark:text-indigo-200 font-mono">
            {isAdvanced ? step.advancedFormula : step.basicHint}
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar (if any) */}
      {controls && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs">
          {controls}
        </div>
      )}

      {/* Main Interactive Stage */}
      <div>{children}</div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
        >
          ← Previous Step
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
        >
          {isLast ? 'Complete Module 🎉' : 'Next Step →'}
        </Button>
      </div>
    </div>
  );
}
