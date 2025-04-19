"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Settings, BookOpen, BarChart4, Clock, Calendar, Rocket } from "lucide-react"
import { ArrowRight } from "lucide-react"


/*
https://teacher-ai-lemon.vercel.app/profile

OR

https://localhost:3000/profile

This is the main page of the app. It is the first page that the user sees when they open the app. on the above links
*/

export default function ProfilePage() {
  // Sample user data
  const user = {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    joinDate: "January 2023",
    subjects: ["Physics", "Mathematics", "Chemistry"],
    stats: {
      quizzesTaken: 42,
      averageScore: 78,
      studyHours: 156,
      topicsCompleted: 28,
    },
    recentActivity: [
      {
        id: 1,
        type: "quiz",
        subject: "Physics",
        topic: "Thermodynamics",
        score: 85,
        date: "2023-05-15",
      },
      {
        id: 2,
        type: "study",
        subject: "Mathematics",
        topic: "Linear Algebra",
        duration: 45,
        date: "2023-05-14",
      },
      {
        id: 3,
        type: "quiz",
        subject: "Chemistry",
        topic: "Periodic Table",
        score: 62,
        date: "2023-05-12",
      },
    ],
    upcomingExams: [
      {
        id: 1,
        subject: "Physics",
        date: "2023-06-15",
        preparedness: 65,
      },
      {
        id: 2,
        subject: "Mathematics",
        date: "2023-06-22",
        preparedness: 80,
      },
    ],
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-start gap-8">
        <div className="flex flex-col items-center text-center md:w-1/4">
          <Avatar className="h-32 w-32 mb-4">
            <AvatarImage src="/placeholder.svg" alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground mb-4">{user.email}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {user.subjects.map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            ))}
          </div>
          <div className="w-full space-y-2">
            <Button className="w-full" asChild>
              <Link href="/profile/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="exams">Exams</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Study Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                        <p className="text-2xl font-bold">{user.stats.quizzesTaken}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Average Score</p>
                        <p className="text-2xl font-bold">{user.stats.averageScore}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Study Hours</p>
                        <p className="text-2xl font-bold">{user.stats.studyHours}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Topics Completed</p>
                        <p className="text-2xl font-bold">{user.stats.topicsCompleted}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user.recentActivity.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          {activity.type === "quiz" ? (
                            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                              <BarChart4 className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-green-100 p-2 text-green-600">
                              <Clock className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {activity.subject}: {activity.topic}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type === "quiz"
                                ? `Quiz Score: ${activity.score}%`
                                : `Study Session: ${activity.duration} min`}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      View All Activity
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Study Roadmaps</CardTitle>
                      <Button asChild>
                        <Link href="/profile/roadmaps">
                          <Rocket className="mr-2 h-4 w-4" />
                          Manage Roadmaps
                        </Link>
                      </Button>
                    </div>
                    <CardDescription>Your personalized learning paths</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">Physics Mastery</h3>
                            <p className="text-sm text-muted-foreground">
                              Complete roadmap to master physics fundamentals
                            </p>
                          </div>
                          <Badge>Physics</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>35%</span>
                          </div>
                          <Progress value={35} className="h-2" />
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Current focus: <span className="font-medium">Thermodynamics</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/profile/roadmaps/physics-101">View Roadmap</Link>
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">Advanced Mathematics</h3>
                            <p className="text-sm text-muted-foreground">From calculus to advanced topics</p>
                          </div>
                          <Badge>Mathematics</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>50%</span>
                          </div>
                          <Progress value={50} className="h-2" />
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Current focus: <span className="font-medium">Linear Algebra</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/profile/roadmaps/math-advanced">View Roadmap</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Your recent learning activities and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {user.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        {activity.type === "quiz" ? (
                          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                            <BarChart4 className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-green-100 p-3 text-green-600">
                            <Clock className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">
                              {activity.subject}: {activity.topic}
                            </h3>
                            <p className="text-sm text-muted-foreground">{activity.date}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.type === "quiz"
                              ? `You scored ${activity.score}% on this quiz`
                              : `You studied for ${activity.duration} minutes`}
                          </p>
                          {activity.type === "quiz" && (
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Score</span>
                                <span>{activity.score}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${activity.score}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {activity.type === "study" && (
                            <Button variant="outline" size="sm" className="mt-2">
                              Continue Studying
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exams">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Exams</CardTitle>
                  <CardDescription>Track your exam preparation progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {user.upcomingExams.map((exam) => (
                      <div key={exam.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium">{exam.subject} Exam</h3>
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="inline-block h-4 w-4 mr-1" />
                              {exam.date}
                            </p>
                          </div>
                          <Button asChild>
                            <Link href={`/exam-mode?subject=${exam.subject.toLowerCase()}`}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              Study Now
                            </Link>
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Preparedness</span>
                            <span>{exam.preparedness}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${exam.preparedness}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href={`/profile/roadmaps`} className="text-sm font-medium text-primary hover:underline">
                            View recommended study roadmap
                            <ArrowRight className="inline-block ml-1 h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

