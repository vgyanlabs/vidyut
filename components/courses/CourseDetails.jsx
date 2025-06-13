import { FaClock, FaListUl, FaCheckCircle } from 'react-icons/fa';

export default function CourseDetails({ duration, syllabus, prerequisites }) {
  return (
    <section className="w-full bg-white/90 rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Information</h2>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
            <FaClock className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Duration</h3>
            <p className="text-gray-600">{duration}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
            <FaListUl className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Syllabus</h3>
            <p className="text-gray-600">{syllabus}</p>
          </div>
        </div>

        {prerequisites && (
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
              <FaCheckCircle className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Prerequisites</h3>
              <p className="text-gray-600">{prerequisites}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 