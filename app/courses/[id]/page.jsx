'use client';

import { useState } from 'react';
import CourseHeader from '@/components/courses/CourseHeader';
import LevelSelector from '@/components/courses/LevelSelector';
import CourseDetails from '@/components/courses/CourseDetails';
import QuizStarter from '@/components/courses/QuizStarter';

const MOCK_COURSE = {
  title: 'Advanced JavaScript',
  description:
    'Master advanced JavaScript concepts including closures, prototypes, async programming, and modern ES6+ features.',
  duration: '6 weeks (estimated 24 hours total)',
  syllabus:
    'Functions, Closures, Scope, Prototypes, Inheritance, Async Programming, ES6+ Features',
  prerequisites: 'Basic JavaScript knowledge',
};

export default function CoursePage() {
  const [selectedLevel, setSelectedLevel] = useState('beginner');

  // In a real app, you would fetch course data and levels dynamically

  const handleStartQuiz = () => {
    // TODO: Route to quiz page for this course and level
    alert(`Starting quiz for ${selectedLevel} level!`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      <CourseHeader title={MOCK_COURSE.title} description={MOCK_COURSE.description} />
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center px-4 py-8 md:py-12 pb-32 md:pb-16">
        <div className="w-full max-w-3xl mx-auto space-y-12">
          <LevelSelector selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />
          <CourseDetails
            duration={MOCK_COURSE.duration}
            syllabus={MOCK_COURSE.syllabus}
            prerequisites={MOCK_COURSE.prerequisites}
          />
          <div className="w-full text-center">
            <p className="text-lg text-gray-700 font-medium bg-white/80 rounded-xl p-6 shadow-sm border border-gray-100">
              Based on your selected level, a personalized quiz will be generated to assess your knowledge.
            </p>
          </div>
        </div>
      </main>
      <QuizStarter onStart={handleStartQuiz} disabled={false} />
    </div>
  );
} 