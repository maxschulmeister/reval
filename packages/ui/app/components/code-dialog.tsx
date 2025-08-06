"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import Code from "react-shiki";
import flourite from "flourite";
import { ReactNode } from "react";

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
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="w-full max-w-[60rem] shadow-none bg-background border-border rounded-radius">
        <DialogHeader>
          <DialogTitle className="capitalize text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Code
            language={detectedLanguage}
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
