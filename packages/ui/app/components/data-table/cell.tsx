"use client";

import type { ReactNode } from "react";

interface CellProps {
  children: ReactNode;
  className?: string;
}

export const Cell = ({ children, className = "" }: CellProps) => {
  const baseClasses = "text-sm text-card-foreground";
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return <div className={finalClasses}>{children}</div>;
};