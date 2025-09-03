"use client";

import { cn } from "@/app/lib/utils";
import { Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { P } from "./ui/typography";

interface LoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export const Loading = ({ 
  message = "Loading...", 
  className,
  size = "md" 
}: LoadingProps) => {
  return (
    <div className={cn(
      "flex min-h-[200px] items-center justify-center p-8",
      className
    )}>
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className={cn("animate-spin", sizeClasses[size])} />
          <P className="text-muted-foreground">{message}</P>
        </div>
      </Card>
    </div>
  );
};

// Inline loading spinner for smaller components
export const LoadingSpinner = ({ 
  size = "sm", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) => {
  return (
    <Loader2 className={cn(
      "animate-spin", 
      sizeClasses[size],
      className
    )} />
  );
};