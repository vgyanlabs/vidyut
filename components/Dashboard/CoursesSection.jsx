import CourseCard from "./CourseCard";

export default function CoursesSection({courses, title}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course, i) => (
                <CourseCard key={i} course={course} i={i} />
            ))}
          </div>
        </div>
    );
}