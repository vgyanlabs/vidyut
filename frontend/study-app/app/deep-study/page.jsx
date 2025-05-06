import { ReusableCard } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeepStudy() {
  return (
    <div className="container flex flex-col items-center justify-center px-4 py-12 md:px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Deep Study Mode</h1>
      <p className="mb-8 text-center text-muted-foreground">
        This feature is coming soon. Deep Study mode will allow you to explore topics in-depth with comprehensive
        learning materials.
      </p>

      <ReusableCard
        title="Try Exam Mode Instead"
        description="Prepare for your upcoming exams with our guided learning experience"
        footer={
          <Button asChild className="w-full">
            <a href="/exam-mode">Go to Exam Mode</a>
          </Button>
        }
      >
        <BookOpen className="h-5 w-5 text-primary" />
      </ReusableCard>
    </div>
  );
}
