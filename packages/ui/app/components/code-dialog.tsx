"use client";

import type { Run } from "@reval/core/types";
import flourite from "flourite";
import jsBeautify from "js-beautify";
import { ReactNode, useState } from "react";
import Code from "react-shiki";
import { NavigableDialog } from "./navigable-dialog";

interface CodeDialogProps {
  title: string;
  content: string;
  trigger?: ReactNode;
  rowIndex?: number;
  allRows?: Run[];
  columnId?: string;
}

export const CodeDialog = ({
  title,
  content,
  trigger,
  rowIndex,
  allRows,
  columnId,
}: CodeDialogProps) => {
  const [currentContent, setCurrentContent] = useState(content);

  // Detect language using flourite
  const detectedLanguage = flourite(currentContent, { shiki: true }).language;

  const handleContentChange = (newValue: unknown) => {
    if (newValue) {
      const formattedContent = jsBeautify(JSON.stringify(newValue, null, 2), {
        indent_size: 4,
        indent_char: " ",
      });
      setCurrentContent(formattedContent);
    }
  };

  return (
    <NavigableDialog
      title={title}
      trigger={trigger}
      rowIndex={rowIndex}
      allRows={allRows}
      columnId={columnId}
      className="rounded-radius w-full max-w-[60rem] border-border bg-background shadow-none"
      onContentChange={handleContentChange}
    >
      <div className="max-h-[60vh] overflow-auto">
        <Code
          language={
            detectedLanguage === "unknown" ? "text" : detectedLanguage
          }
          theme="github-dark"
          className="max-w-full overflow-auto text-sm"
        >
          {currentContent}
        </Code>
      </div>
    </NavigableDialog>
  );
};
