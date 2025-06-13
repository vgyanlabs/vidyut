const LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export default function LevelSelector({ selectedLevel, onSelectLevel }) {
  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Level</h2>
      <p className="text-gray-600 mb-6">Choose the difficulty level that best matches your current knowledge</p>
      <div className="flex gap-4 w-full justify-center">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            className={`px-7 py-4 rounded-xl border-2 text-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              ${selectedLevel === level.value
                ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-102'}
            `}
            aria-pressed={selectedLevel === level.value}
            onClick={() => onSelectLevel(level.value)}
            style={{ minWidth: 160 }}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
} 