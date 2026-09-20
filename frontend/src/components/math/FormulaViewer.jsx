export function FormulaViewer({ formula, explanation, className = '' }) {
  return (
    <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-center ${className}`}>
      <div className="font-mono text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
        {formula}
      </div>
      {explanation && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {explanation}
        </p>
      )}
    </div>
  );
}
