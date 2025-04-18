"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ChevronRight } from "lucide-react"

export default function ExamMode() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState("")
  const [examDate, setExamDate] = useState<Date>()
  const [duration, setDuration] = useState("")
  const [topics, setTopics] = useState<string[]>([])

  const availableTopics = {
    mathematics: [
      "Algebra",
      "Calculus",
      "Geometry",
      "Trigonometry",
      "Statistics",
      "Probability",
      "Number Theory",
      "Linear Algebra",
    ],
    physics: [
      "Mechanics",
      "Thermodynamics",
      "Electromagnetism",
      "Optics",
      "Quantum Physics",
      "Relativity",
      "Nuclear Physics",
      "Fluid Dynamics",
    ],
    chemistry: [
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Physical Chemistry",
      "Analytical Chemistry",
      "Biochemistry",
      "Polymer Chemistry",
      "Electrochemistry",
      "Thermochemistry",
    ],
    biology: ["Cell Biology", "Genetics", "Ecology", "Evolution", "Physiology", "Microbiology", "Botany", "Zoology"],
  }

  const handleTopicToggle = (topic: string) => {
    setTopics(topics.includes(topic) ? topics.filter((t) => t !== topic) : [...topics, topic])
  }

  const handleNext = () => {
    if (step === 2) {
      router.push(`/exam-mode/study?subject=${subject}&topics=${topics.join(",")}`)
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="container max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Exam Mode Setup</h1>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Your Subject</CardTitle>
            <CardDescription>Select the subject you want to prepare for and set your exam details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-date">Exam Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="exam-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {examDate ? format(examDate, "PPP") : "Select exam date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={examDate} onSelect={setExamDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Exam Duration (hours)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleNext} disabled={!subject || !examDate || !duration} className="ml-auto">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && subject && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Topics</CardTitle>
            <CardDescription>Choose the topics you want to include in your exam preparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableTopics[subject as keyof typeof availableTopics]?.map((topic) => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox
                    id={topic}
                    checked={topics.includes(topic)}
                    onCheckedChange={() => handleTopicToggle(topic)}
                  />
                  <Label htmlFor={topic}>{topic}</Label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={topics.length === 0}>
              Start Learning <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

