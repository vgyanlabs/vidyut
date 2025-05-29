'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    level: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  const topics = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
  ];

  const levels = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // const response = await fetch('/api/onboarding', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     userId: session.user.id,
      //     ...formData,
      //   }),
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.error || 'Something went wrong');
      // }

      // Redirect to dashboard after successful onboarding
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <Image
              src="/logo.png"
              alt="Vidyut Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-[#37474F]">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-[#37474F]">
            Help us personalize your learning experience
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#37474F] mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-[#37474F] mb-1">
                Choose Your Topic
              </label>
              <select
                id="topic"
                name="topic"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                value={formData.topic}
                onChange={handleChange}
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37474F] mb-2">
                Select Your Level
              </label>
              <div className="space-y-2">
                {levels.map((level) => (
                  <div key={level.id} className="flex items-center">
                    <input
                      id={level.id}
                      name="level"
                      type="radio"
                      required
                      value={level.id}
                      checked={formData.level === level.id}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#007BFF] focus:ring-[#007BFF] border-gray-300"
                    />
                    <label
                      htmlFor={level.id}
                      className="ml-2 block text-sm text-[#37474F]"
                    >
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#007BFF] hover:bg-[#00B8D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] transition-colors duration-200"
            >
              Complete Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
