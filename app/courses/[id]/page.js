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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <CourseHeader title={MOCK_COURSE.title} description={MOCK_COURSE.description} />
      <main className="flex-1 w-full flex flex-col items-center px-4 pb-32 md:pb-0">
        <LevelSelector selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />
        <CourseDetails
          duration={MOCK_COURSE.duration}
          syllabus={MOCK_COURSE.syllabus}
          prerequisites={MOCK_COURSE.prerequisites}
        />
        <div className="w-full max-w-2xl mx-auto text-center mt-8">
          <p className="mb-6 text-lg text-gray-700 font-medium">Based on the selected level, a quiz will be generated.</p>
        </div>
      </main>
      <QuizStarter onStart={handleStartQuiz} disabled={false} />
    </div>
  );
} 