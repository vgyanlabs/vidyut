import Link from 'next/link';

export default function CourseCard({ course, i }) {
    return (
        <Link 
        href={`/courses/${course.id}`} 
        key={i}
        className="block group relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900">{course.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.progress}%` }}></div>
          </div>
        </div>
      </Link>
    );
}