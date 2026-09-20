/**
 * SplitPane: Side-by-side comparison container.
 * Essential for comparing Pixel Canvas, Matrix Grid, and Transformed Outputs side-by-side.
 */
export function SplitPane({
  leftTitle = 'Visual Representation',
  rightTitle = 'Mathematical Matrix',
  left,
  right,
  className = ''
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch ${className}`}>
      {/* Left Panel */}
      <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
        {leftTitle && (
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            {leftTitle}
          </h4>
        )}
        <div className="flex-1 flex flex-col items-center justify-center">
          {left}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
        {rightTitle && (
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            {rightTitle}
          </h4>
        )}
        <div className="flex-1 flex flex-col items-center justify-center">
          {right}
        </div>
      </div>
    </div>
  );
}
