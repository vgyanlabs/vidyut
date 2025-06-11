"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    institution: "",
  });
  const [error, setError] = useState("");
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    special: false,
    digit: false,
    uppercase: false,
  });
  const router = useRouter();

  // Password validation function
  const validatePassword = (password) => {
    const errors = {
      length: password.length < 7,
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(password),
      digit: !/\d/.test(password),
      uppercase: !/[A-Z]/.test(password),
    };
    setPasswordErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate password when it changes
    if (name === "password") {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!validatePassword(formData.password)) {
      setError("Please fix password requirements");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Create user account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          institution: formData.institution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Sign in the user
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-[#37474F]">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-[#007BFF] hover:text-[#00B8D4]"
            >
              Sign in
            </Link>
          </p>
        </div>
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} suppressHydrationWarning={true}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="" hidden>Select your role</option>
                <option value="Student">Student</option>
                <option value="Working professional">
                  Working professional
                </option>
              </select>
            </div>
            <div>
              <label htmlFor="institution" className="sr-only">
                College/Workplace
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder={
                  formData.role === "Student" ? "College Name" : "Place of Work"
                }
                value={formData.institution}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
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
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
              
              {passwordFocus && (
                <div className="absolute z-10 mt-2 w-full bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className={`flex items-center ${!passwordErrors.length ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{!passwordErrors.length ? '✓' : '×'}</span>
                      Minimum 7 characters
                    </li>
                    <li className={`flex items-center ${!passwordErrors.special ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{!passwordErrors.special ? '✓' : '×'}</span>
                      At least one special character (!@#$%^&*(),.?":{'{'}|&lt;&gt;)
                    </li>
                    <li className={`flex items-center ${!passwordErrors.digit ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{!passwordErrors.digit ? '✓' : '×'}</span>
                      At least one number
                    </li>
                    <li className={`flex items-center ${!passwordErrors.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="mr-2">{!passwordErrors.uppercase ? '✓' : '×'}</span>
                      At least one uppercase letter
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#37474F] focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#007BFF] hover:bg-[#00B8D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF]"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
