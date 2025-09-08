"use client";

import { PDFViewer, PdfFocusProvider } from "@llamaindex/pdf-viewer";
import "@llamaindex/pdf-viewer/index.css";
import Image from "next/image";
import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
interface FileDialogProps {
  title: string;
  content: string;
  trigger?: ReactNode;
}

export const FileDialog = ({ title, content, trigger }: FileDialogProps) => {
  const isPdf = content.toLowerCase().endsWith(".pdf");
  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="rounded-radius h-[calc(100vh-4rem)] w-full border-border bg-background shadow-none">
        <DialogHeader>
          <DialogTitle className="text-foreground capitalize">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          {isPdf ? (
            <PdfFocusProvider>
              <PDFViewer
                file={{
                  id: title,
                  url: `/api/files/${content}`,
                }}
              />
            </PdfFocusProvider>
          ) : (
            <Image
              src={`/api/files/${content}`}
              width={9999}
              height={9999}
              alt={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
