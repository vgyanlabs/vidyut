'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement sign in logic
    console.log('Sign in:', { email, password });
    router.push('/onboarding');
  };

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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-[#37474F]">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-[#007BFF] hover:text-[#00B8D4]">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#007BFF] focus:ring-[#007BFF] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[#37474F]">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#007BFF] hover:text-[#00B8D4]">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#007BFF] hover:bg-[#00B8D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF]"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 