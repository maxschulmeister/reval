"use client";

import type { Run } from "@reval/core/types";
import { PDFViewer, PdfFocusProvider } from "@llamaindex/pdf-viewer";
import "@llamaindex/pdf-viewer/index.css";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { NavigableDialog } from "./navigable-dialog";

interface FileDialogProps {
  title: string;
  content: string;
  trigger?: ReactNode;
  rowIndex?: number;
  allRows?: Run[];
  columnId?: string;
}

export const FileDialog = ({ 
  title, 
  content, 
  trigger, 
  rowIndex, 
  allRows, 
  columnId 
}: FileDialogProps) => {
  const [currentContent, setCurrentContent] = useState(content);
  
  const isPdf = currentContent.toLowerCase().endsWith(".pdf");
  
  const handleContentChange = (newValue: unknown) => {
    if (newValue && typeof newValue === 'string') {
      setCurrentContent(newValue);
    }
  };
  
  return (
    <NavigableDialog
      title={title}
      trigger={trigger}
      rowIndex={rowIndex}
      allRows={allRows}
      columnId={columnId}
      className="rounded-radius h-[calc(100vh-4rem)] w-full border-border bg-background shadow-none"
      onContentChange={handleContentChange}
    >
      <div className="overflow-auto flex-1">
        {isPdf ? (
          <PdfFocusProvider>
            <PDFViewer
              file={{
                id: title,
                url: `/api/files/${currentContent}`,
              }}
            />
          </PdfFocusProvider>
        ) : (
          <Image
            src={`/api/files/${currentContent}`}
            width={9999}
            height={9999}
            alt={title}
          />
        )}
      </div>
    </NavigableDialog>
  );
};
