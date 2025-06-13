"use client";

import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <img
              src="/vidyutlogo2.png"
              alt="Logo"
              className="h-12 w-auto"
            />
          </div>
          {/* Center: Welcome Message */}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-700">
              Welcome, {session.user?.name || 'User'}!
            </h2>
          </div>
          {/* Right: Notification and Avatar */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="h-9 w-9 rounded-full object-cover border border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 