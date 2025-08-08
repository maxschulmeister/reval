"use client";

import flourite from "flourite";
import { ReactNode } from "react";
import Code from "react-shiki";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface CodeDialogProps {
  title: string;
  content: string;
  trigger?: ReactNode;
}

export const CodeDialog = ({ title, content, trigger }: CodeDialogProps) => {
  // Detect language using flourite
  const detectedLanguage = flourite(content, { shiki: true }).language;

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-background border-border rounded-radius w-full max-w-[60rem] shadow-none">
        <DialogHeader>
          <DialogTitle className="text-foreground capitalize">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Code
            language={
              detectedLanguage === "unknown" ? "text" : detectedLanguage
            }
            theme="github-dark"
            className="max-w-full overflow-auto text-sm"
          >
            {content}
          </Code>
        </div>
      </DialogContent>
    </Dialog>
  );
};
