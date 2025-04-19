import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Brain, Database, GitBranch } from "lucide-react";
import TeacherAICard from "../compounds/TeacherAICard";
/*
https://teacher-ai-lemon.vercel.app/

OR

https://localhost:3000/

This is the main page of the app. It is the first page that the user sees when they open the app. on the above links
*/
export default function Home() {
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Welcome</h1>
      <p className="mb-8 text-muted-foreground">
        Choose a learning mode to get started with your exam preparation
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <TeacherAICard 
          title="Exam Mode" 
          description="Prepare for upcoming exams with focused learning paths" 
          link="/exam-mode" 
          icon={<BookOpen className="h-5 w-5 text-primary" />} 
        />

        <TeacherAICard 
          title="Deep Study" 
          description="Dive deep into subjects with comprehensive learning materials" 
          link="/deep-study" 
          icon={<Brain className="h-5 w-5 text-primary" />} 
        />

        <TeacherAICard 
          title="Manage Knowledgebase" 
          description="Upload and organize your study materials" 
          link="/manage-knowledgebase" 
          icon={<Database className="h-5 w-5 text-primary" />} 
        />

        <TeacherAICard 
          title="Knowledge Graph" 
          description="Visualize connections between your study materials" 
          link="/knowledge-graph" 
          icon={<GitBranch className="h-5 w-5 text-primary" />} 
        />
      </div>
    </div>
  );
}
