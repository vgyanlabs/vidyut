"use client"

import { useEffect, useRef } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"

// Custom node types
import RoadmapNode from "./roadmap-node"

// Define node types
const nodeTypes = {
  roadmapNode: RoadmapNode,
}

interface RoadmapVisualizerProps {
  nodes: any[]
  onNodeClick?: (node: any) => void
}

export default function RoadmapVisualizer({ nodes, onNodeClick }: RoadmapVisualizerProps) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([])
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Convert roadmap nodes to ReactFlow nodes and edges
  useEffect(() => {
    if (!nodes || nodes.length === 0) return

    // Create nodes
    const reactFlowNodes: Node[] = nodes.map((node, index) => {
      // Calculate position based on status and dependencies
      let position = { x: 0, y: 0 }

      // Completed nodes at the beginning
      if (node.status === "completed") {
        position = { x: 50, y: index * 150 }
      }
      // In-progress nodes in the middle
      else if (node.status === "in-progress") {
        position = { x: 300, y: index * 150 }
      }
      // Recommended nodes after in-progress
      else if (node.status === "recommended") {
        position = { x: 550, y: index * 150 }
      }
      // Locked nodes at the end
      else {
        position = { x: 800, y: index * 150 }
      }

      return {
        id: node.id,
        type: "roadmapNode",
        data: {
          ...node,
          onClick: () => onNodeClick && onNodeClick(node),
        },
        position,
      }
    })

    // Create edges
    const reactFlowEdges: Edge[] = []

    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach((childId: string) => {
          reactFlowEdges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
            type: "smoothstep",
            animated: true,
            style: {
              stroke:
                node.status === "completed"
                  ? "#10b981"
                  : node.status === "in-progress"
                    ? "#3b82f6"
                    : node.status === "recommended"
                      ? "#eab308"
                      : "#9ca3af",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color:
                node.status === "completed"
                  ? "#10b981"
                  : node.status === "in-progress"
                    ? "#3b82f6"
                    : node.status === "recommended"
                      ? "#eab308"
                      : "#9ca3af",
            },
          })
        })
      }
    })

    setFlowNodes(reactFlowNodes)
    setFlowEdges(reactFlowEdges)
  }, [nodes, onNodeClick, setFlowEdges, setFlowNodes])

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.data?.status === "completed") return "#10b981"
            if (n.data?.status === "in-progress") return "#3b82f6"
            if (n.data?.status === "recommended") return "#eab308"
            return "#9ca3af"
          }}
          nodeColor={(n) => {
            if (n.data?.status === "completed") return "#dcfce7"
            if (n.data?.status === "in-progress") return "#dbeafe"
            if (n.data?.status === "recommended") return "#fef9c3"
            return "#f3f4f6"
          }}
        />
      </ReactFlow>
    </div>
  )
}

