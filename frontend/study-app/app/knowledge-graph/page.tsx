"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  Panel,
  type NodeChange,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Link, FileText, Book, Trash2, Maximize } from "lucide-react"

// Custom node types
import CustomNode from "@/components/knowledge-graph/custom-node"

// Define node types
const nodeTypes = {
  custom: CustomNode,
}

// Sample knowledge base items
const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "Physics Textbook",
      type: "book",
      content: "Comprehensive physics textbook covering mechanics, thermodynamics, and electromagnetism.",
      connections: 5,
    },
    position: { x: 250, y: 5 },
  },
  {
    id: "2",
    type: "custom",
    data: {
      label: "Newton's Laws",
      type: "notes",
      content: "Detailed notes on Newton's three laws of motion with examples.",
      connections: 3,
    },
    position: { x: 100, y: 100 },
  },
  {
    id: "3",
    type: "custom",
    data: {
      label: "Thermodynamics",
      type: "notes",
      content: "Notes on the laws of thermodynamics and entropy.",
      connections: 2,
    },
    position: { x: 400, y: 100 },
  },
  {
    id: "4",
    type: "custom",
    data: {
      label: "Quantum Physics",
      type: "lesson",
      content: "Lesson plan on quantum physics fundamentals.",
      connections: 1,
    },
    position: { x: 400, y: 200 },
  },
  {
    id: "5",
    type: "custom",
    data: {
      label: "Electromagnetism",
      type: "notes",
      content: "Notes on electromagnetic fields and Maxwell's equations.",
      connections: 2,
    },
    position: { x: 150, y: 200 },
  },
  {
    id: "6",
    type: "custom",
    data: {
      label: "Chemistry Basics",
      type: "book",
      content: "Introduction to chemistry covering atoms, molecules, and reactions.",
      connections: 1,
    },
    position: { x: 300, y: 300 },
  },
]

// Sample connections between knowledge base items
const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-5",
    source: "1",
    target: "5",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e2-5",
    source: "2",
    target: "5",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-6",
    source: "1",
    target: "6",
    animated: true,
    style: { stroke: "#88ccff" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
]

function KnowledgeGraphFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [newNodeData, setNewNodeData] = useState({
    label: "",
    type: "notes",
    content: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const reactFlowInstance = useReactFlow()
  const connectingNodeId = useRef<string | null>(null)

  // Filter nodes based on search term
  const filteredNodes = searchTerm
    ? nodes.filter(
        (node) =>
          node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.data.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : nodes

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Handle connection
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#88ccff" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds,
        ),
      )

      // Update connection count for source and target nodes
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === params.source || node.id === params.target) {
            return {
              ...node,
              data: {
                ...node.data,
                connections: node.data.connections + 1,
              },
            }
          }
          return node
        }),
      )
    },
    [setEdges, setNodes],
  )

  // Handle adding a new node
  const handleAddNode = () => {
    if (!newNodeData.label) return

    const newId = (nodes.length + 1).toString()
    const newNode: Node = {
      id: newId,
      type: "custom",
      data: {
        ...newNodeData,
        connections: 0,
      },
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      },
    }

    setNodes((nds) => [...nds, newNode])
    setNewNodeData({
      label: "",
      type: "notes",
      content: "",
    })
    setIsAddingNode(false)
  }

  // Handle deleting a node
  const handleDeleteNode = () => {
    if (!selectedNode) return

    // Remove all connected edges
    const edgesToRemove = edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)

    // Update connection count for connected nodes
    const connectedNodeIds = new Set<string>()
    edgesToRemove.forEach((edge) => {
      if (edge.source !== selectedNode.id) connectedNodeIds.add(edge.source)
      if (edge.target !== selectedNode.id) connectedNodeIds.add(edge.target)
    })

    setNodes((nds) =>
      nds
        .filter((node) => node.id !== selectedNode.id)
        .map((node) => {
          if (connectedNodeIds.has(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                connections: Math.max(0, node.data.connections - 1),
              },
            }
          }
          return node
        }),
    )

    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))

    setSelectedNode(null)
  }

  // Handle starting a connection
  const handleStartConnecting = () => {
    if (!selectedNode) return
    connectingNodeId.current = selectedNode.id
    setIsConnecting(true)
  }

  // Handle completing a connection
  const handleCompleteConnection = (targetNode: Node) => {
    if (!connectingNodeId.current || connectingNodeId.current === targetNode.id) return

    const newEdge: Edge = {
      id: `e${connectingNodeId.current}-${targetNode.id}`,
      source: connectingNodeId.current,
      target: targetNode.id,
      animated: true,
      style: { stroke: "#88ccff" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }

    // Check if this connection already exists
    const connectionExists = edges.some(
      (edge) =>
        (edge.source === connectingNodeId.current && edge.target === targetNode.id) ||
        (edge.source === targetNode.id && edge.target === connectingNodeId.current),
    )

    if (!connectionExists) {
      setEdges((eds) => [...eds, newEdge])

      // Update connection count for source and target nodes
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === connectingNodeId.current || node.id === targetNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                connections: node.data.connections + 1,
              },
            }
          }
          return node
        }),
      )
    }

    connectingNodeId.current = null
    setIsConnecting(false)
  }

  // Handle node changes (position, etc.)
  const handleNodesChange = (changes: NodeChange[]) => {
    // If we're in connecting mode and a node is selected, check if it's a connection completion
    if (isConnecting && connectingNodeId.current) {
      const selectChange = changes.find((change) => change.type === "select" && change.selected === true)

      if (selectChange && "id" in selectChange) {
        const targetNodeId = selectChange.id
        const targetNode = nodes.find((node) => node.id === targetNodeId)

        if (targetNode) {
          handleCompleteConnection(targetNode)
          return // Skip normal node changes to prevent selection
        }
      }
    }

    onNodesChange(changes)
  }

  // Handle zooming to fit all nodes
  const handleFitView = () => {
    reactFlowInstance.fitView({ padding: 0.2 })
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        className="bg-gray-900"
      >
        <Background color="#aaa" gap={16} />
        <Controls className="bg-gray-800 text-white border-gray-700" />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "custom") return "#fff"
            return "#555"
          }}
          nodeColor={(n) => {
            if (n.data.type === "book") return "#6366f1"
            if (n.data.type === "notes") return "#10b981"
            return "#f97316"
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          className="bg-gray-800 border-gray-700"
        />

        <Panel position="top-left" className="bg-gray-800 p-2 rounded-md border border-gray-700">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search knowledge items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </Panel>

        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAddingNode(true)}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleStartConnecting}
            disabled={!selectedNode || isConnecting}
            className={`bg-gray-800 border-gray-700 text-white hover:bg-gray-700 ${
              isConnecting ? "bg-blue-900 border-blue-700" : ""
            }`}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDeleteNode}
            disabled={!selectedNode}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleFitView}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </Panel>

        {isConnecting && (
          <Panel position="bottom-center" className="bg-blue-900 p-2 rounded-md border border-blue-700">
            <div className="text-white text-sm flex items-center gap-2">
              <Link className="h-4 w-4" />
              Click on another node to create a connection
            </div>
          </Panel>
        )}

        {selectedNode && (
          <Panel position="bottom-right" className="w-80">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{selectedNode.data.label}</CardTitle>
                <CardDescription className="text-gray-400 flex items-center gap-1">
                  {selectedNode.data.type === "book" ? (
                    <Book className="h-3 w-3" />
                  ) : selectedNode.data.type === "notes" ? (
                    <FileText className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {selectedNode.data.type.charAt(0).toUpperCase() + selectedNode.data.type.slice(1)} •
                  {selectedNode.data.connections} connection{selectedNode.data.connections !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{selectedNode.data.content}</p>
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>

      <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Knowledge Item</DialogTitle>
            <DialogDescription>Create a new item in your knowledge graph</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title"
                value={newNodeData.label}
                onChange={(e) => setNewNodeData({ ...newNodeData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newNodeData.type}
                onValueChange={(value) => setNewNodeData({ ...newNodeData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="lesson">Lesson Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                placeholder="Enter content or description"
                value={newNodeData.content}
                onChange={(e) => setNewNodeData({ ...newNodeData, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNode(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function KnowledgeGraph() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-gray-900 text-white">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <h1 className="text-xl font-bold">Knowledge Graph</h1>
          <p className="ml-4 text-gray-400">Visualize connections between your study materials</p>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlowProvider>
          <KnowledgeGraphFlow />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

