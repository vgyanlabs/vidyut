import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Construction } from "lucide-react"

export default function DeepStudy() {
  return (
    <div className="container flex flex-col items-center justify-center px-4 py-12 md:px-6">
      <Construction className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Deep Study Mode</h1>
      <p className="mb-8 text-center text-muted-foreground">
        This feature is coming soon. Deep Study mode will allow you to explore topics in-depth with comprehensive
        learning materials.
      </p>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Try Exam Mode Instead
          </CardTitle>
          <CardDescription>Prepare for your upcoming exams with our guided learning experience</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/exam-mode">Go to Exam Mode</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

