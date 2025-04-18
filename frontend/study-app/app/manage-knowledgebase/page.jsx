"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Book, FileUp, Trash2 } from "lucide-react"
import Link from "next/link"

export default function ManageKnowledgebase() {
  const [files, setFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: "Physics Textbook.pdf", type: "book", size: "12.5 MB", date: "2023-04-15" },
    { id: 2, name: "Chemistry Notes.docx", type: "notes", size: "2.3 MB", date: "2023-04-10" },
    { id: 3, name: "Math Lesson Plan.pdf", type: "lesson", size: "4.7 MB", date: "2023-04-05" },
  ])

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = () => {
    // In a real app, you would upload the files to a server here
    const newUploadedFiles = files.map((file, index) => ({
      id: uploadedFiles.length + index + 1,
      name: file.name,
      type: file.name.endsWith(".pdf") ? "book" : file.name.endsWith(".docx") ? "notes" : "lesson",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toISOString().split("T")[0],
    }))

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles])
    setFiles([])
  }

  const handleDelete = (id) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id))
  }

  const getFileIcon = (type) => {
    switch (type) {
      case "book":
        return <Book className="h-4 w-4" />
      case "notes":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col items-center text-center">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Manage Knowledgebase</h1>
      <p className="mb-8 text-muted-foreground">
        Upload your study materials to generate personalized quizzes and tutorials
      </p>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="library">My Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Materials</CardTitle>
              <CardDescription>Add books, notes, or lesson plans to your knowledgebase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="files">Files</Label>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
                    <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-xl font-semibold">Drag & Drop Files</p>
                    <p className="mb-4 text-sm text-muted-foreground">or click to browse files on your computer</p>
                    <Input id="files" type="file" multiple className="hidden" onChange={handleFileChange} />
                    <Button asChild variant="outline">
                      <label htmlFor="files" className="cursor-pointer">
                        <FileUp className="mr-2 h-4 w-4" />
                        Browse Files
                      </label>
                    </Button>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Selected Files</h3>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpload} disabled={files.length === 0} className="ml-auto">
                Upload Files
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>My Library</CardTitle>
              <CardDescription>Manage your uploaded study materials</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-medium">No files uploaded yet</h3>
                  <p className="mb-4 text-muted-foreground">Upload your study materials to get started</p>
                  <Button asChild variant="outline">
                    <a href="#" onClick={() => document.querySelector('[value="upload"]')?.click()}>
                      Upload Files
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>Uploaded on {file.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {file.type}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/knowledge-graph">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      View Knowledge Graph
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

