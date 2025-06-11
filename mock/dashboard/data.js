// Mock API response for user stats
export const userStats = {
  coursesCompleted: 12,
  hoursLearned: 48,
  currentStreak: 7,
  lastUpdated: "2024-03-20T10:00:00Z"
};

// Mock API response for user's courses
export const userCourses = [
  {
    id: "course-1",
    title: "Advanced JavaScript",
    level: "Intermediate",
    progress: 75,
    color: "bg-blue-500",
    totalModules: 12,
    completedModules: 9,
    lastAccessed: "2024-03-20T09:30:00Z",
    instructor: "Sarah Johnson",
    thumbnail: "/images/courses/js-advanced.jpg"
  },
  {
    id: "course-2",
    title: "React Fundamentals",
    level: "Beginner",
    progress: 45,
    color: "bg-purple-500",
    totalModules: 8,
    completedModules: 4,
    lastAccessed: "2024-03-19T15:45:00Z",
    instructor: "Mike Chen",
    thumbnail: "/images/courses/react-fundamentals.jpg"
  },
  {
    id: "course-3",
    title: "Node.js Mastery",
    level: "Advanced",
    progress: 30,
    color: "bg-green-500",
    totalModules: 15,
    completedModules: 5,
    lastAccessed: "2024-03-18T11:20:00Z",
    instructor: "Alex Rodriguez",
    thumbnail: "/images/courses/node-mastery.jpg"
  }
];

// Mock API response for learning progress
export const learningProgress = {
  dailyProgress: [
    { date: "2024-03-14", minutes: 45 },
    { date: "2024-03-15", minutes: 60 },
    { date: "2024-03-16", minutes: 30 },
    { date: "2024-03-17", minutes: 90 },
    { date: "2024-03-18", minutes: 75 },
    { date: "2024-03-19", minutes: 120 },
    { date: "2024-03-20", minutes: 60 }
  ],
  weeklyStats: {
    totalMinutes: 480,
    averageDailyMinutes: 68.5,
    mostActiveDay: "2024-03-19",
    streakDays: 7
  },
  courseProgress: [
    { courseId: "course-1", progress: 75 },
    { courseId: "course-2", progress: 45 },
    { courseId: "course-3", progress: 30 }
  ]
};

// Mock API response for user achievements
export const userAchievements = [
  {
    id: "achievement-1",
    title: "7 Day Streak",
    description: "Maintained a 7-day learning streak",
    icon: "streak",
    unlockedAt: "2024-03-20T00:00:00Z"
  },
  {
    id: "achievement-2",
    title: "Quick Learner",
    description: "Completed 5 modules in a single day",
    icon: "lightning",
    unlockedAt: "2024-03-19T23:59:59Z"
  }
];

// Mock API response for recommended courses
export const recommendedCourses = [
  {
    id: "course-4",
    title: "TypeScript Essentials",
    level: "Intermediate",
    instructor: "Emma Wilson",
    rating: 4.8,
    students: 1250,
    thumbnail: "/images/courses/typescript.jpg"
  },
  {
    id: "course-5",
    title: "Advanced React Patterns",
    level: "Advanced",
    instructor: "David Kim",
    rating: 4.9,
    students: 980,
    thumbnail: "/images/courses/react-patterns.jpg"
  }
];
