import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Brain, Database } from "lucide-react"

export default function Home() {
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Welcome to StudyPro</h1>
      <p className="mb-8 text-muted-foreground">Choose a learning mode to get started with your exam preparation</p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Exam Mode
            </CardTitle>
            <CardDescription>Prepare for upcoming exams with focused learning paths</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Set up your exam details, select topics, and get a personalized study plan with progress tracking.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/exam-mode" className="w-full">
              <Button className="w-full">Start Exam Prep</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Deep Study
            </CardTitle>
            <CardDescription>Dive deep into subjects with comprehensive learning materials</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Explore topics in-depth with detailed explanations, examples, and practice exercises.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/deep-study" className="w-full">
              <Button className="w-full" variant="outline">
                Start Deep Study
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Manage Knowledgebase
            </CardTitle>
            <CardDescription>Upload and organize your study materials</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Upload books, notes, and lesson plans to generate personalized quizzes and tutorials.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/manage-knowledgebase" className="w-full">
              <Button className="w-full" variant="outline">
                Manage Materials
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Knowledge Graph
            </CardTitle>
            <CardDescription>Visualize connections between your study materials</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Explore relationships between concepts and materials in an interactive graph view.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/knowledge-graph" className="w-full">
              <Button className="w-full" variant="outline">
                Open Graph
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

