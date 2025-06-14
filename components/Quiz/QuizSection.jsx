"use client";

import React, { useState, useEffect } from 'react';
import { quizData } from './quizData';
import Header from './Header';
import ProgressBar from './ProgressBar';
import StartPage from './StartPage';
import QuizQuestion from './QuizQuestion';
import ResultSummary from './ResultSummary';

const QuizSection = () => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval;
    if (quizStarted && !quizCompleted && !showSummary) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, quizCompleted, showSummary]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: optionIndex
    });
  };

  const handleSubmitAnswer = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowResult(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResult(false);
    setQuizCompleted(false);
    setTimeElapsed(0);
    setShowSummary(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  // Start Page
  if (!quizStarted) {
    return <StartPage quizData={quizData} startQuiz={startQuiz} />;
  }

  // Result Summary
  if (showSummary) {
    return (
      <ResultSummary
        score={calculateScore()}
        totalQuestions={quizData.questions.length}
        timeElapsed={timeElapsed}
        formatTime={formatTime}
        resetQuiz={resetQuiz}
      />
    );
  }

  const currentQuestionData = quizData.questions[currentQuestion];
  const isAnswerSelected = selectedAnswers[currentQuestion] !== undefined;
  const selectedOption = selectedAnswers[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Header timeElapsed={timeElapsed} formatTime={formatTime} />

        {/* Topic Name Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{quizData.topicName}</h1>
            <div className="flex items-center justify-center space-x-4 text-gray-600">
              <span>Question {currentQuestion + 1} of {quizData.totalQuestions}</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Quiz</span>
            </div>
          </div>
        </div>

        <ProgressBar currentQuestion={currentQuestion} totalQuestions={quizData.questions.length} />

        <QuizQuestion
          currentQuestionData={currentQuestionData}
          selectedOption={selectedOption}
          showResult={showResult}
          handleAnswerSelect={handleAnswerSelect}
          handleSubmitAnswer={handleSubmitAnswer}
          isAnswerSelected={isAnswerSelected}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          currentQuestion={currentQuestion}
          totalQuestions={quizData.questions.length}
        />
      </div>
    </div>
  );
};

export default QuizSection; 