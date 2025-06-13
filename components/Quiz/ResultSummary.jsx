import React from 'react';

const ResultSummary = ({ score, totalQuestions, timeElapsed, formatTime, resetQuiz }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Vidyut</span>
          </div>
        </div>

        {/* Completion Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Well Done!</h1>
          <p className="text-gray-600 mb-8">You've successfully completed the quiz</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{score}/{totalQuestions}</div>
              <div className="text-gray-600">Score</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{percentage}%</div>
              <div className="text-gray-600">Accuracy</div>
            </div>
            <div className="bg-cyan-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-cyan-600 mb-2">{formatTime(timeElapsed)}</div>
              <div className="text-gray-600">Time taken</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={resetQuiz}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4h8m0 0v8m0-8l-8 8 8-8z" />
              </svg>
              <span>Retry Quiz</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span>Next Level</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultSummary; 