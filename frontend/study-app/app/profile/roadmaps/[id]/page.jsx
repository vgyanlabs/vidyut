"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart4,
  Lightbulb,
  Save,
} from "lucide-react"
import RoadmapVisualizer from "@/components/roadmap/roadmap-visualizer"



/*
https://teacher-ai-lemon.vercel.app/profile/roadmaps/[id]

Where id is the id of the roadmap. an interger for example: https://teacher-ai-lemon.vercel.app/profile/roadmaps/1

OR

https://localhost:3000/profile/roadmaps/[id]

Where id is the id of the roadmap. an interger for example: https://localhost:3000/profile/roadmaps/1

This is the page that the user sees when they click on a roadmap from the profile page.
*/

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
        status: "completed",
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

// Helper function to calculate progress
const calculateProgress = (nodes) => {
  if (nodes.length === 0) return 0

  const completedNodes = nodes.filter((node) => node.status === "completed").length
  return Math.round((completedNodes / nodes.length) * 100)
}

export default function RoadmapDetailPage({ params }) {
  const router = useRouter()
  const [roadmap, setRoadmap] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedRoadmap, setEditedRoadmap] = useState(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [newNode, setNewNode] = useState({
    title: "",
    description: "",
    prerequisite: "",
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [isEditingNode, setIsEditingNode] = useState(false)
  const [activeTab, setActiveTab] = useState("visual")

  // Load roadmap data
  useEffect(() => {
    const foundRoadmap = initialRoadmaps.find((r) => r.id === params.id)
    if (foundRoadmap) {
      setRoadmap(foundRoadmap)
      setEditedRoadmap(JSON.parse(JSON.stringify(foundRoadmap)))
    } else {
      router.push("/profile/roadmaps")
    }
  }, [params.id, router])

  if (!roadmap) {
    return <div className="container py-12 text-center">Loading roadmap...</div>
  }

  // Handle saving roadmap edits
  const handleSaveRoadmap = () => {
    if (!editedRoadmap) return

    // Update progress based on completed nodes
    const updatedRoadmap = {
      ...editedRoadmap,
      progress: calculateProgress(editedRoadmap.nodes),
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    setRoadmap(updatedRoadmap)
    setIsEditing(false)
  }

  // Handle adding a new node
  const handleAddNode = () => {
    if (!newNode.title || !newNode.prerequisite) return

    const nodeId = newNode.title.toLowerCase().replace(/\s+/g, "-")

    // Find the prerequisite node
    const prerequisiteNode = editedRoadmap.nodes.find((node) => node.id === newNode.prerequisite)

    if (prerequisiteNode) {
      // Add the new node
      const updatedNodes = [
        ...editedRoadmap.nodes,
        {
          id: nodeId,
          title: newNode.title,
          description: newNode.description,
          status: "locked",
          quizScore: null,
          children: [],
        },
      ]

      // Update the prerequisite node's children
      const updatedNodesWithLinks = updatedNodes.map((node) => {
        if (node.id === newNode.prerequisite) {
          return {
            ...node,
            children: [...node.children, nodeId],
          }
        }
        return node
      })

      setEditedRoadmap({
        ...editedRoadmap,
        nodes: updatedNodesWithLinks,
      })

      setNewNode({
        title: "",
        description: "",
        prerequisite: "",
      })

      setIsAddingNode(false)
    }
  }

  // Handle updating a node
  const handleUpdateNode = () => {
    if (!selectedNode) return

    const updatedNodes = editedRoadmap.nodes.map((node) => {
      if (node.id === selectedNode.id) {
        return selectedNode
      }
      return node
    })

    setEditedRoadmap({
      ...editedRoadmap,
      nodes: updatedNodes,
    })

    setSelectedNode(null)
    setIsEditingNode(false)
  }

  // Handle deleting a node
  const handleDeleteNode = (nodeId) => {
    // Remove the node
    const filteredNodes = editedRoadmap.nodes.filter((node) => node.id !== nodeId)

    // Remove references to the node from other nodes' children
    const updatedNodes = filteredNodes.map((node) => ({
      ...node,
      children: node.children.filter((childId) => childId !== nodeId),
    }))

    setEditedRoadmap({
      ...editedRoadmap,
      nodes: updatedNodes,
    })

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null)
      setIsEditingNode(false)
    }
  }

  // Get node status icon
  const getNodeStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "recommended":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "locked":
        return <AlertCircle className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/profile/roadmaps">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{roadmap.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roadmap.subject}</Badge>
              <Badge variant="secondary">{roadmap.progress}% Complete</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">{roadmap.description}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="visual">Visual Roadmap</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="edit">Edit Roadmap</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Roadmap
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoadmap}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <TabsContent value="visual" className="mt-0">
        <div className="rounded-lg border bg-card p-4 h-[600px]">
          <RoadmapVisualizer
            nodes={isEditing ? editedRoadmap.nodes : roadmap.nodes}
            onNodeClick={(node) => {
              if (isEditing) {
                setSelectedNode(node)
                setIsEditingNode(true)
              }
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="list" className="mt-0">
        <div className="space-y-4">
          {(isEditing ? editedRoadmap.nodes : roadmap.nodes).map((node) => (
            <Card
              key={node.id}
              className={`border-l-4 ${
                node.status === "completed"
                  ? "border-l-green-500"
                  : node.status === "in-progress"
                    ? "border-l-blue-500"
                    : node.status === "recommended"
                      ? "border-l-yellow-500"
                      : "border-l-gray-300"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNodeStatusIcon(node.status)}
                    <CardTitle className="text-lg">{node.title}</CardTitle>
                  </div>
                  {node.quizScore !== null && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <BarChart4 className="h-3 w-3" />
                      {node.quizScore}%
                    </Badge>
                  )}
                </div>
                <CardDescription>{node.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm">
                  <span className="font-medium">Status: </span>
                  <span className="capitalize">{node.status.replace("-", " ")}</span>
                </div>
                {node.children.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Leads to: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {node.children.map((childId) => {
                        const childNode = (isEditing ? editedRoadmap.nodes : roadmap.nodes).find(
                          (n) => n.id === childId,
                        )
                        return childNode ? (
                          <Badge key={childId} variant="outline" className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            {childNode.title}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
              {isEditing && (
                <CardFooter className="pt-0">
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedNode(node)
                        setIsEditingNode(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNode(node.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="edit" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Roadmap Details</CardTitle>
            <CardDescription>Edit your roadmap information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={editedRoadmap?.title || ""}
                onChange={(e) => setEditedRoadmap({ ...editedRoadmap, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={editedRoadmap?.description || ""}
                onChange={(e) => setEditedRoadmap({ ...editedRoadmap, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Select
                value={editedRoadmap?.subject || ""}
                onValueChange={(value) => setEditedRoadmap({ ...editedRoadmap, subject: value })}
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

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Topics</h3>
                <Button variant="outline" size="sm" onClick={() => setIsAddingNode(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Topic
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Manage the topics in your roadmap</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dialog for adding a new node */}
      <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>Add a new topic to your roadmap</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="node-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="node-title"
                placeholder="e.g., Quantum Mechanics"
                value={newNode.title}
                onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="node-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="node-description"
                placeholder="Brief description of this topic"
                value={newNode.description}
                onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="node-prerequisite" className="text-sm font-medium">
                Prerequisite Topic
              </label>
              <Select
                value={newNode.prerequisite}
                onValueChange={(value) => setNewNode({ ...newNode, prerequisite: value })}
              >
                <SelectTrigger id="node-prerequisite">
                  <SelectValue placeholder="Select a prerequisite topic" />
                </SelectTrigger>
                <SelectContent>
                  {editedRoadmap?.nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNode(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>Add Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing a node */}
      <Dialog open={isEditingNode} onOpenChange={setIsEditingNode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>Update this topic in your roadmap</DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-node-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-node-title"
                  value={selectedNode.title}
                  onChange={(e) => setSelectedNode({ ...selectedNode, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-node-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-node-description"
                  value={selectedNode.description}
                  onChange={(e) => setSelectedNode({ ...selectedNode, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-node-status" className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={selectedNode.status}
                  onValueChange={(value) => setSelectedNode({ ...selectedNode, status: value })}
                >
                  <SelectTrigger id="edit-node-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(selectedNode.status === "completed" || selectedNode.status === "in-progress") && (
                <div className="space-y-2">
                  <label htmlFor="edit-node-score" className="text-sm font-medium">
                    Quiz Score (%)
                  </label>
                  <Input
                    id="edit-node-score"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedNode.quizScore || ""}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        quizScore: e.target.value ? Number.parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingNode(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNode}>Update Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

