"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { CheckCircle2, Clock, Lightbulb, Lock, BarChart4 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

function RoadmapNode({ data, isConnectable }: NodeProps) {
  // Get node status color
  const getNodeColor = () => {
    switch (data.status) {
      case "completed":
        return "bg-green-50 border-green-200"
      case "in-progress":
        return "bg-blue-50 border-blue-200"
      case "recommended":
        return "bg-yellow-50 border-yellow-200"
      case "locked":
        return "bg-gray-50 border-gray-200"
      default:
        return "bg-white border-gray-200"
    }
  }

  // Get node status icon
  const getNodeStatusIcon = () => {
    switch (data.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "recommended":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "locked":
        return <Lock className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div
      className={`px-4 py-3 rounded-md border shadow-sm ${getNodeColor()} min-w-[200px] max-w-[250px] cursor-pointer`}
      onClick={data.onClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-200 border-2 border-white"
      />

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {getNodeStatusIcon()}
          <div className="font-medium">{data.title}</div>
        </div>
        {data.quizScore !== null && (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <BarChart4 className="h-3 w-3" />
            {data.quizScore}%
          </Badge>
        )}
      </div>

      <p className="text-xs text-gray-600 line-clamp-2">{data.description}</p>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-200 border-2 border-white"
      />
    </div>
  )
}

export default memo(RoadmapNode)

