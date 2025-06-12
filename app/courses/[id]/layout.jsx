import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CourseLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
} 