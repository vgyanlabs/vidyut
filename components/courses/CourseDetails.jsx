import { FaClock, FaListUl, FaCheckCircle } from 'react-icons/fa';

export default function CourseDetails({ duration, syllabus, prerequisites }) {
  return (
    <section className="w-full max-w-3xl mx-auto my-10 bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-start md:items-center border border-gray-100">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-blue-700 text-lg font-semibold">
          <FaClock className="text-xl" />
          <span>Estimated Duration:</span>
          <span className="font-normal text-gray-700">{duration}</span>
        </div>
        <div className="flex items-center gap-3 text-blue-700 text-lg font-semibold">
          <FaListUl className="text-xl" />
          <span>Syllabus Overview:</span>
          <span className="font-normal text-gray-700">{syllabus}</span>
        </div>
        {prerequisites && (
          <div className="flex items-center gap-3 text-blue-700 text-lg font-semibold">
            <FaCheckCircle className="text-xl" />
            <span>Prerequisites:</span>
            <span className="font-normal text-gray-700">{prerequisites}</span>
          </div>
        )}
      </div>
    </section>
  );
} 