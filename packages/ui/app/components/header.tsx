"use client";

import type { Eval } from "@rectangle0/reval-core/types";
import { Circle, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeleteEvalDialog } from "./delete-eval-dialog";
import { EditEvalDialog } from "./edit-eval-dialog";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { H3 } from "./ui/typography";

interface HeaderProps {
  evals: Eval[];
  currentEvalId: string;
  currentEvalName: string;
  currentEval: Eval;
  isLoading?: boolean;
}

export const Header = ({
  evals,
  currentEvalId,
  currentEvalName,
  currentEval,
  isLoading = false,
}: HeaderProps) => {
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(false);

  const handleEvalChange = (newEvalId: string) => {
    router.push(`/eval/${newEvalId}`);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShowLoading(true), 250); // Only show after 500ms
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div className="flex items-center justify-between border-b border-border">
      <Cell borderRight>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Sync Status Indicator */}
            <div
              className="flex items-center"
              title={isLoading ? "Syncing..." : "Live sync active"}
            >
              <AnimatePresence mode="wait">
                {showLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <LoaderCircle className="w-4 animate-spin text-muted" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Circle className="w-4 text-success" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Select value={currentEvalId} onValueChange={handleEvalChange}>
              <SelectTrigger
                aria-label="Change eval"
                className="h-auto w-auto gap-1.5 rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <H3 as="h1">{currentEvalName || "Select an eval"}</H3>
              </SelectTrigger>
              <SelectContent className="rounded-radius border border-border bg-popover shadow-none">
                {evals.map((evalItem) => (
                  <SelectItem key={evalItem.id} value={evalItem.id}>
                    {evalItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentEval && (
            <>
              <EditEvalDialog evalItem={currentEval} />
              <DeleteEvalDialog evalItem={currentEval} evals={evals} />
            </>
          )}
        </div>
      </Cell>

      <Cell borderLeft>
        <ThemeSwitcher />
        <Button
          variant="outline"
          onClick={() => window.open("https://www.github.com", "_blank")}
          className="rounded-radius border-border shadow-none hover:text-primary"
        >
          GitHub
        </Button>
        <Button
          onClick={() => window.open("https://www.google.com", "_blank")}
          className="rounded-radius bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
        >
          Documentation
        </Button>
      </Cell>
    </div>
  );
};
