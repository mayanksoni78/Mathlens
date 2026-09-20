/**
 * MatrixDisplay: Renders a 2D matrix inside brackets, with editable or selectable cells.
 */
export function MatrixDisplay({
  matrix,
  selectedCell = null,
  onCellClick,
  onCellChange,
  editable = false,
  className = ''
}) {
  if (!matrix || !matrix.length) return null;

  const cols = matrix[0].length;

  return (
    <div className={`inline-flex items-center justify-center p-2 select-none ${className}`}>
      {/* Left Bracket */}
      <div className="w-2.5 self-stretch border-l-2 border-t-2 border-b-2 border-gray-700 dark:border-gray-300 rounded-l-md mr-1.5" />

      {/* Grid of numbers */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
        }}
      >
        {matrix.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
            const isDark = typeof val === 'number' ? val < 128 : true;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick && onCellClick(r, c)}
                className={`relative w-10 h-10 flex items-center justify-center rounded text-xs font-mono font-bold transition-all ${
                  editable || onCellClick ? 'cursor-pointer hover:scale-105' : ''
                } ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 scale-105 shadow-md z-10'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
                style={{
                  backgroundColor: typeof val === 'number' ? `rgb(${val}, ${val}, ${val})` : '#eee',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              >
                {editable && isSelected ? (
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={val}
                    onChange={(e) => onCellChange && onCellChange(r, c, Number(e.target.value))}
                    className="w-full h-full text-center bg-transparent font-bold focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span>{Array.isArray(val) ? `[${val.join(',')}]` : val}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Right Bracket */}
      <div className="w-2.5 self-stretch border-r-2 border-t-2 border-b-2 border-gray-700 dark:border-gray-300 rounded-r-md ml-1.5" />
    </div>
  );
}
