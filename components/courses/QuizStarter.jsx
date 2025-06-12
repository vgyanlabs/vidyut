export default function QuizStarter({ onStart, disabled }) {
  return (
    <div className="w-full flex justify-center fixed md:static bottom-0 left-0 z-30 bg-gradient-to-t from-white/90 via-white/60 to-transparent py-6 md:py-0">
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className={`px-12 py-4 rounded-full font-bold text-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg
          ${disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:scale-105 hover:shadow-xl'}
        `}
        style={{ minWidth: 220 }}
      >
        Start Quiz
      </button>
    </div>
  );
} 