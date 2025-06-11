import StatsOverview from "./StatsOverview";
import CoursesSection from "./CoursesSection";
import ProgressSection from "./ProgressSection";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StatsOverview />
      <CoursesSection />
      <ProgressSection />
    </div>
  );
}
