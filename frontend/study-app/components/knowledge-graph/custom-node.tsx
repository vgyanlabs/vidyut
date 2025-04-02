import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Book, FileText, FileCode } from "lucide-react"

function CustomNode({ data, isConnectable }: NodeProps) {
  // Determine node color based on type
  const getNodeColor = () => {
    switch (data.type) {
      case "book":
        return "bg-indigo-500 border-indigo-600"
      case "notes":
        return "bg-emerald-500 border-emerald-600"
      case "lesson":
        return "bg-orange-500 border-orange-600"
      default:
        return "bg-blue-500 border-blue-600"
    }
  }

  // Determine icon based on type
  const getNodeIcon = () => {
    switch (data.type) {
      case "book":
        return <Book className="h-4 w-4" />
      case "notes":
        return <FileText className="h-4 w-4" />
      case "lesson":
        return <FileCode className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className={`px-4 py-2 rounded-md border shadow-md ${getNodeColor()} text-white min-w-[150px] max-w-[200px]`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-200 border-2 border-white"
      />
      <div className="flex items-center gap-2">
        {getNodeIcon()}
        <div className="font-medium truncate">{data.label}</div>
      </div>
      <div className="text-xs mt-1 opacity-80 truncate">
        {data.connections} connection{data.connections !== 1 ? "s" : ""}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-200 border-2 border-white"
      />
    </div>
  )
}

export default memo(CustomNode)

