export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 255,
  step = 1,
  unit = '',
  color = 'indigo',
  className = ''
}) {
  const accentColors = {
    indigo: 'accent-indigo-600',
    red: 'accent-red-500',
    green: 'accent-green-500',
    blue: 'accent-blue-500',
    purple: 'accent-purple-500'
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>{label}</span>
        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full cursor-pointer ${accentColors[color] || 'accent-indigo-600'}`}
      />
    </div>
  );
}
