import React from 'react';

const QuizQuestion = ({
  currentQuestionData,
  selectedOption,
  showResult,
  handleAnswerSelect,
  handleSubmitAnswer,
  isAnswerSelected,
  handlePrevious,
  handleNext,
  currentQuestion,
  totalQuestions
}) => {
  return (
    <>
      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {currentQuestionData.question}
        </h2>

        <div className="space-y-4 mb-8">
          {currentQuestionData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                showResult
                  ? index === currentQuestionData.correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : index === selectedOption && index !== currentQuestionData.correctAnswer
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-gray-50 text-gray-800'
                  : selectedOption === index
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  showResult
                    ? index === currentQuestionData.correctAnswer
                      ? 'border-green-500 bg-green-500'
                      : index === selectedOption && index !== currentQuestionData.correctAnswer
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                    : selectedOption === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {showResult && index === currentQuestionData.correctAnswer && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showResult && index === selectedOption && index !== currentQuestionData.correctAnswer && (
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  )}
                  {!showResult && selectedOption === index && (
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  )}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        {!showResult && (
          <button
            onClick={handleSubmitAnswer}
            disabled={!isAnswerSelected}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
              isAnswerSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        )}
      </div>

      {/* Result Card */}
      {showResult && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className={`p-4 rounded-xl ${
            selectedOption === currentQuestionData.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              selectedOption === currentQuestionData.correctAnswer
                ? 'text-green-800'
                : 'text-red-800'
            }`}>
              {selectedOption === currentQuestionData.correctAnswer ? 'Correct!' : 'Incorrect'}
            </h3>
            <p className="text-gray-700">{currentQuestionData.explanation}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {showResult && (
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentQuestion === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span>{currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default QuizQuestion; 