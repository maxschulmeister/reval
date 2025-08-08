"use client";

import type { Run } from "@reval/core/src/types";
import { useRouter } from "next/navigation";
import { ThemeSwitcher, type ThemeSwitcherProps } from "./theme-switcher";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { H3 } from "./ui/typography";

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
    <div className="border-border flex items-center justify-between border-b">
      <Cell borderRight>
        <Select value={currentRunId} onValueChange={handleRunChange}>
          <SelectTrigger
            aria-label="Change run"
            className="h-auto w-auto gap-1.5 rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <H3 as="h1">{currentRunName || "Select a run"}</H3>
          </SelectTrigger>
          <SelectContent className="border-border rounded-radius bg-popover border shadow-none">
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
