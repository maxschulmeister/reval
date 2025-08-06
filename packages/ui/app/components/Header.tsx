"use client";

import type { Run } from "@reval/core";
import { useRouter } from "next/navigation";
import { ThemeSwitcher, type ThemeSwitcherProps } from "./theme-switcher";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

interface HeaderProps {
  runs: Run[];
  currentRunId: string;
  currentRunName: string;
  theme: string | undefined;
  onThemeChange: (theme: string) => void;
}

export const Header = ({
  runs,
  currentRunId,
  currentRunName,
  theme,
  onThemeChange,
}: HeaderProps) => {
  const router = useRouter();

  const handleRunChange = (newRunId: string) => {
    router.push(`/run/${newRunId}`);
  };

  return (
    <div className="flex items-center justify-between border-b border-border">
      <Cell borderRight>
        <Select value={currentRunId} onValueChange={handleRunChange}>
          <SelectTrigger
            aria-label="Change run"
            className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none data-[state=open]:text-primary text-muted-foreground gap-1.5 rounded-none"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {currentRunName || "Select a run"}
            </h1>
          </SelectTrigger>
          <SelectContent className="border border-border shadow-none rounded-radius bg-popover">
            {runs.map((run) => (
              <SelectItem key={run.id} value={run.id}>
                {run.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Cell>
      <div className="flex items-center gap-0">
        <Cell borderLeft>
          <ThemeSwitcher
            onChange={onThemeChange}
            value={theme as ThemeSwitcherProps["value"]}
          />
          <Button
            variant="outline"
            onClick={() => window.open("https://www.github.com", "_blank")}
            className="rounded-radius border-border hover:text-primary shadow-none"
          >
            GitHub
          </Button>
          <Button
            onClick={() => window.open("https://www.google.com", "_blank")}
            className="rounded-radius bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
          >
            Documentation
          </Button>
        </Cell>
      </div>
    </div>
  );
};
