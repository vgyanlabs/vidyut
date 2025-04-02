"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, Trophy, ArrowLeft, ArrowRight } from "lucide-react"

export default function StudyPage() {
  const searchParams = useSearchParams()
  const subject = searchParams.get("subject") || ""
  const topicsParam = searchParams.get("topics") || ""
  const topics = topicsParam.split(",")

  const [currentTopicIndex, setCurrentTopicIndex] = useState(0)
  const [currentTab, setCurrentTab] = useState("learn")
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(3600) // 1 hour in seconds
  const [overallProgress, setOverallProgress] = useState(0)
  const [estimatedScore, setEstimatedScore] = useState(0)

  const currentTopic = topics[currentTopicIndex]

  // Mock content for demonstration
  const mockContent = {
    learn: {
      title: `Understanding ${currentTopic}`,
      content: `This is a comprehensive tutorial on ${currentTopic}. The content would include detailed explanations, examples, and interactive elements to help you understand the concepts better.`,
      sections: [
        {
          title: "Key Concepts",
          content: "Here we would explain the fundamental concepts and principles.",
        },
        {
          title: "Examples",
          content: "Practical examples to illustrate the concepts in action.",
        },
        {
          title: "Common Mistakes",
          content: "Highlighting common errors students make and how to avoid them.",
        },
      ],
    },
    quiz: {
      questions: [
        {
          id: 1,
          question: `What is the main principle of ${currentTopic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option B",
        },
        {
          id: 2,
          question: `Which of the following is NOT related to ${currentTopic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option D",
        },
        {
          id: 3,
          question: `In what year was the theory of ${currentTopic} first proposed?`,
          options: ["1905", "1923", "1947", "1962"],
          correctAnswer: "1923",
        },
      ],
    },
  }

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle quiz submission
  const handleQuizSubmit = () => {
    const correctAnswers = mockContent.quiz.questions.filter((q) => quizAnswers[q.id] === q.correctAnswer).length

    const score = (correctAnswers / mockContent.quiz.questions.length) * 100
    setEstimatedScore(Math.round(score))
    setQuizSubmitted(true)

    // Update overall progress
    const newProgress = Math.min(100, overallProgress + Math.round(100 / topics.length))
    setOverallProgress(newProgress)
  }

  // Navigate to next topic
  const goToNextTopic = () => {
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1)
      setCurrentTab("learn")
      setQuizStarted(false)
      setQuizAnswers({})
      setQuizSubmitted(false)
    }
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {subject.charAt(0).toUpperCase() + subject.slice(1)} Exam Preparation
          </h1>
          <p className="text-muted-foreground">Mastering one topic at a time</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Estimated Score: {estimatedScore}%
          </Badge>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <Badge
            key={topic}
            variant={index === currentTopicIndex ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCurrentTopicIndex(index)}
          >
            {index < currentTopicIndex && <CheckCircle className="mr-1 h-3 w-3" />}
            {topic}
          </Badge>
        ))}
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <Card>
            <CardHeader>
              <CardTitle>{mockContent.learn.title}</CardTitle>
              <CardDescription>Master the fundamentals before taking the quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>{mockContent.learn.content}</p>

                {mockContent.learn.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <p>{section.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setCurrentTab("quiz")} className="ml-auto">
                Take Quiz <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>Quiz: {currentTopic}</CardTitle>
              <CardDescription>Test your knowledge to track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              {!quizStarted && !quizSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <h3 className="mb-4 text-xl font-medium">Ready to test your knowledge?</h3>
                  <p className="mb-6 text-center text-muted-foreground">
                    This quiz will help you assess your understanding of {currentTopic}. Answer all questions to see
                    your progress.
                  </p>
                  <Button onClick={() => setQuizStarted(true)}>Start Quiz</Button>
                </div>
              ) : quizSubmitted ? (
                <div className="space-y-6 py-4">
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <h3 className="mb-2 text-xl font-medium">Quiz Results</h3>
                    <div className="mb-4 text-5xl font-bold">{estimatedScore}%</div>
                    <p className="text-muted-foreground">
                      {estimatedScore >= 70
                        ? "Great job! You're well prepared for this topic."
                        : "Keep studying this topic to improve your score."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {mockContent.quiz.questions.map((q) => {
                      const isCorrect = quizAnswers[q.id] === q.correctAnswer
                      return (
                        <div
                          key={q.id}
                          className={`rounded-lg border p-4 ${
                            isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          }`}
                        >
                          <p className="font-medium">{q.question}</p>
                          <p className="mt-2">
                            Your answer:{" "}
                            <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                              {quizAnswers[q.id] || "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && <p className="mt-1 text-green-600">Correct answer: {q.correctAnswer}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {mockContent.quiz.questions.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <h3 className="font-medium">
                        Question {q.id}: {q.question}
                      </h3>
                      <RadioGroup
                        value={quizAnswers[q.id]}
                        onValueChange={(value) => {
                          setQuizAnswers({ ...quizAnswers, [q.id]: value })
                        }}
                      >
                        {q.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${q.id}-${option}`} />
                            <Label htmlFor={`q${q.id}-${option}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {quizStarted && !quizSubmitted ? (
                <>
                  <Button variant="outline" onClick={() => setCurrentTab("learn")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning
                  </Button>
                  <Button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < mockContent.quiz.questions.length}
                  >
                    Submit Quiz
                  </Button>
                </>
              ) : quizSubmitted ? (
                <Button onClick={goToNextTopic} className="ml-auto">
                  {currentTopicIndex < topics.length - 1 ? "Next Topic" : "Complete Exam Prep"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setCurrentTab("learn")} variant="outline" className="ml-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

