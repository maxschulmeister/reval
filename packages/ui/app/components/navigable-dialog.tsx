"use client";

import { getValueAtPath } from "@rectangle0/reval-core/client";
import type { Run } from "@rectangle0/reval-core/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface NavigableDialogProps {
  title: string;
  trigger?: ReactNode;
  rowIndex?: number;
  allRows?: Run[];
  columnId?: string;
  children: ReactNode;
  className?: string;
  onContentChange?: (content: unknown, rowIndex: number) => void;
}

export const NavigableDialog = ({
  title,
  trigger,
  rowIndex,
  allRows,
  columnId,
  children,
  className,
  onContentChange,
}: NavigableDialogProps) => {
  const [currentRowIndex, setCurrentRowIndex] = useState(rowIndex ?? 0);

  const canNavigate = allRows && columnId && rowIndex !== undefined;
  const hasPrevious = canNavigate && currentRowIndex > 0;
  const hasNext = canNavigate && currentRowIndex < allRows.length - 1;

  const navigateToRow = (direction: "previous" | "next") => {
    if (!canNavigate) return;

    const newIndex =
      direction === "previous" ? currentRowIndex - 1 : currentRowIndex + 1;
    if (newIndex < 0 || newIndex >= allRows.length) return;

    const newRowData = allRows[newIndex];
    const newValue = getValueAtPath(
      newRowData as Record<string, unknown>,
      columnId,
    );

    if (newValue) {
      setCurrentRowIndex(newIndex);
      onContentChange?.(newValue, newIndex);
    }
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="text-foreground capitalize">
            {title}
            {canNavigate && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({currentRowIndex + 1} of {allRows.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        {children}
        {canNavigate && (
          <DialogFooter className="items-center sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToRow("previous")}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToRow("next")}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
