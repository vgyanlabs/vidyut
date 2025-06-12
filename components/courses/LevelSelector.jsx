const LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export default function LevelSelector({ selectedLevel, onSelectLevel }) {
  return (
    <div className="w-full flex flex-col items-center mb-10">
      <span className="text-base font-semibold text-gray-700 mb-3">Select your level</span>
      <div className="flex gap-4 w-full justify-center">
        {LEVELS.map((level, idx) => (
          <button
            key={level.value}
            type="button"
            className={`px-7 py-3 rounded-full border-2 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 shadow-sm
              ${selectedLevel === level.value
                ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg'
                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}
            `}
            aria-pressed={selectedLevel === level.value}
            onClick={() => onSelectLevel(level.value)}
            style={{ minWidth: 140 }}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
} 