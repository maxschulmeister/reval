"use client";

import type { Eval } from "@reval/core/types";
import { useRouter } from "next/navigation";
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
}

export const Header = ({
  evals,
  currentEvalId,
  currentEvalName,
  currentEval,
}: HeaderProps) => {
  const router = useRouter();

  const handleEvalChange = (newEvalId: string) => {
    router.push(`/eval/${newEvalId}`);
  };

  return (
    <div className="flex items-center justify-between border-b border-border">
      <Cell borderRight>
        <div className="flex items-center gap-4">
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
          {currentEval && (
            <>
              <EditEvalDialog evalItem={currentEval} />
              <DeleteEvalDialog evalItem={currentEval} evals={evals} />
            </>
          )}
        </div>
      </Cell>
      <div className="flex items-center gap-0">
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
    </div>
  );
};
