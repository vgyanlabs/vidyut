export default function CoursesSection() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all courses
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Advanced JavaScript", level: "Intermediate", progress: 75, color: "bg-blue-500" },
              { title: "React Fundamentals", level: "Beginner", progress: 45, color: "bg-purple-500" },
              { title: "Node.js Mastery", level: "Advanced", progress: 30, color: "bg-green-500" }
            ].map((course, i) => (
              <div key={i} className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-500">{course.level}</span>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

    );
}