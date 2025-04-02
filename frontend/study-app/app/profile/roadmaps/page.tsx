"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Plus, Edit, Trash2, ArrowRight, Rocket } from "lucide-react"

// Sample roadmap data
const initialRoadmaps = [
  {
    id: "physics-101",
    title: "Physics Mastery",
    description: "Complete roadmap to master physics fundamentals",
    progress: 35,
    lastUpdated: "2023-05-15",
    subject: "Physics",
    nodes: [
      {
        id: "mechanics",
        title: "Mechanics",
        description: "Study of motion and forces",
        status: "completed", // completed, in-progress, recommended, locked
        quizScore: 92,
        children: ["thermo"],
      },
      {
        id: "thermo",
        title: "Thermodynamics",
        description: "Study of heat and energy",
        status: "in-progress",
        quizScore: 68,
        children: ["waves", "optics"],
      },
      {
        id: "waves",
        title: "Waves & Oscillations",
        description: "Study of periodic motion",
        status: "recommended",
        quizScore: null,
        children: ["em"],
      },
      {
        id: "optics",
        title: "Optics",
        description: "Study of light behavior",
        status: "recommended",
        quizScore: null,
        children: ["em"],
      },
      {
        id: "em",
        title: "Electromagnetism",
        description: "Study of electricity and magnetism",
        status: "locked",
        quizScore: null,
        children: ["quantum"],
      },
      {
        id: "quantum",
        title: "Quantum Physics",
        description: "Study of subatomic particles",
        status: "locked",
        quizScore: null,
        children: [],
      },
    ],
  },
  {
    id: "math-advanced",
    title: "Advanced Mathematics",
    description: "From calculus to advanced topics",
    progress: 50,
    lastUpdated: "2023-05-10",
    subject: "Mathematics",
    nodes: [
      {
        id: "calculus",
        title: "Calculus",
        description: "Differential and integral calculus",
        status: "completed",
        quizScore: 88,
        children: ["linear-algebra"],
      },
      {
        id: "linear-algebra",
        title: "Linear Algebra",
        description: "Study of linear equations and matrices",
        status: "in-progress",
        quizScore: 75,
        children: ["diff-eq", "probability"],
      },
      {
        id: "diff-eq",
        title: "Differential Equations",
        description: "Equations involving derivatives",
        status: "recommended",
        quizScore: null,
        children: ["complex-analysis"],
      },
      {
        id: "probability",
        title: "Probability & Statistics",
        description: "Study of randomness and data analysis",
        status: "recommended",
        quizScore: null,
        children: ["complex-analysis"],
      },
      {
        id: "complex-analysis",
        title: "Complex Analysis",
        description: "Analysis with complex numbers",
        status: "locked",
        quizScore: null,
        children: [],
      },
    ],
  },
  {
    id: "chemistry-basics",
    title: "Chemistry Foundations",
    description: "Essential chemistry concepts",
    progress: 15,
    lastUpdated: "2023-05-05",
    subject: "Chemistry",
    nodes: [
      {
        id: "atomic-structure",
        title: "Atomic Structure",
        description: "Study of atoms and their components",
        status: "completed",
        quizScore: 85,
        children: ["periodic-table"],
      },
      {
        id: "periodic-table",
        title: "Periodic Table & Trends",
        description: "Elements and their properties",
        status: "in-progress",
        quizScore: 62,
        children: ["bonding"],
      },
      {
        id: "bonding",
        title: "Chemical Bonding",
        description: "How atoms form molecules",
        status: "locked",
        quizScore: null,
        children: ["reactions"],
      },
      {
        id: "reactions",
        title: "Chemical Reactions",
        description: "Types and balancing of reactions",
        status: "locked",
        quizScore: null,
        children: ["organic"],
      },
      {
        id: "organic",
        title: "Organic Chemistry",
        description: "Chemistry of carbon compounds",
        status: "locked",
        quizScore: null,
        children: [],
      },
    ],
  },
]

export default function RoadmapsPage() {
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps)
  const [activeTab, setActiveTab] = useState("all")
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false)
  const [newRoadmap, setNewRoadmap] = useState({
    title: "",
    description: "",
    subject: "",
  })

  // Filter roadmaps based on active tab
  const filteredRoadmaps =
    activeTab === "all" ? roadmaps : roadmaps.filter((roadmap) => roadmap.subject.toLowerCase() === activeTab)

  // Handle creating a new roadmap
  const handleCreateRoadmap = () => {
    if (!newRoadmap.title || !newRoadmap.subject) return

    const newRoadmapObj = {
      id: `${newRoadmap.subject.toLowerCase()}-${Date.now()}`,
      title: newRoadmap.title,
      description: newRoadmap.description,
      progress: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
      subject: newRoadmap.subject,
      nodes: [
        {
          id: "start",
          title: "Getting Started",
          description: `Introduction to ${newRoadmap.subject}`,
          status: "recommended",
          quizScore: null,
          children: [],
        },
      ],
    }

    setRoadmaps([...roadmaps, newRoadmapObj])
    setNewRoadmap({
      title: "",
      description: "",
      subject: "",
    })
    setIsCreatingRoadmap(false)
  }

  // Handle deleting a roadmap
  const handleDeleteRoadmap = (id: string) => {
    setRoadmaps(roadmaps.filter((roadmap) => roadmap.id !== id))
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/profile">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Roadmaps</h1>
          <p className="text-muted-foreground">Personalized learning paths based on your progress</p>
        </div>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="physics">Physics</TabsTrigger>
            <TabsTrigger value="mathematics">Math</TabsTrigger>
            <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
            <TabsTrigger value="biology">Biology</TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog open={isCreatingRoadmap} onOpenChange={setIsCreatingRoadmap}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Roadmap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Roadmap</DialogTitle>
              <DialogDescription>Create a personalized study roadmap for a subject</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Physics Mastery"
                  value={newRoadmap.title}
                  onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Brief description of this roadmap"
                  value={newRoadmap.description}
                  onChange={(e) => setNewRoadmap({ ...newRoadmap, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Select
                  value={newRoadmap.subject}
                  onValueChange={(value) => setNewRoadmap({ ...newRoadmap, subject: value })}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingRoadmap(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoadmap}>Create Roadmap</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoadmaps.map((roadmap) => (
          <Card key={roadmap.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{roadmap.title}</CardTitle>
                  <CardDescription>{roadmap.description}</CardDescription>
                </div>
                <Badge variant="outline">{roadmap.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{roadmap.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${roadmap.progress}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Focus:</h4>
                  {roadmap.nodes
                    .filter((node) => node.status === "in-progress")
                    .map((node) => (
                      <div key={node.id} className="rounded-md border p-2 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{node.title}</span>
                          {node.quizScore !== null && <Badge variant="secondary">{node.quizScore}%</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{node.description}</p>
                      </div>
                    ))}

                  <h4 className="text-sm font-medium mt-4">Recommended Next:</h4>
                  {roadmap.nodes
                    .filter((node) => node.status === "recommended")
                    .slice(0, 2)
                    .map((node) => (
                      <div key={node.id} className="rounded-md border p-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{node.title}</span>
                          <Badge variant="outline">Recommended</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{node.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex w-full justify-between items-center">
                <div className="text-xs text-muted-foreground">Updated: {roadmap.lastUpdated}</div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRoadmap(roadmap.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/roadmaps/${roadmap.id}`)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/profile/roadmaps/${roadmap.id}`)}>
                    View
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredRoadmaps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Rocket className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-medium">No roadmaps found</h3>
          <p className="mb-6 text-muted-foreground max-w-md">
            {activeTab === "all"
              ? "You haven't created any roadmaps yet. Create your first roadmap to start your learning journey."
              : `You don't have any ${activeTab} roadmaps yet. Create one to start learning.`}
          </p>
          <Button onClick={() => setIsCreatingRoadmap(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Roadmap
          </Button>
        </div>
      )}
    </div>
  )
}

