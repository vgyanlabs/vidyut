import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "../components/ui/card";
  import { Button } from "../components/ui/button";
  import Link from "next/link";
  import { BookOpen, Brain, Database } from "lucide-react";


const TeacherAICard = ({title = "", description = "", link = "/", icon = null}) => {
    return (
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {icon && icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </CardContent>
          <CardFooter>
            <Link href={link} className="w-full">
              <Button className="w-full">Start Exam Prep</Button>
            </Link>
          </CardFooter>
        </Card>
    );
};

export default TeacherAICard;