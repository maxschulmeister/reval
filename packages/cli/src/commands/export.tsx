import { exportEval } from "@reval/core";
import { mkdirSync, writeFileSync } from "fs";
import { Box, Text } from "ink";
import { argument, option } from "pastel";
import { dirname } from "path";
import { useEffect, useState } from "react";
import zod from "zod";

export const args = zod.tuple([
  zod.string().describe(
    argument({
      name: "eval_id",
      description: "ID of the eval to export",
    }),
  ),
]);

export const options = zod.object({
  format: zod
    .enum(["json", "csv", "md"])
    .default("json")
    .describe("Export format"),
  out: zod
    .string()
    .optional()
    .describe(
      option({
        description:
          "Output file path (for CSV, this will be the base name for multiple files)",
        alias: "o",
      }),
    ),
});

interface Props {
  args: zod.infer<typeof args>;
  options: zod.infer<typeof options>;
}
// TODO: Add overwrite protection
export default function Export({ args, options }: Props) {
  const [status, setStatus] = useState<"exporting" | "completed" | "error">(
    "exporting",
  );
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | string[] | null>(null);
  const [eval_id] = args;

  useEffect(() => {
    const performExport = async () => {
      try {
        const data = await exportEval(eval_id, options.format);

        if (
          options.format === "csv" &&
          typeof data === "object" &&
          "runs" in data
        ) {
          // Handle CSV dual-file export
          const baseName = options.out || `reval-export-${eval_id.slice(0, 8)}`;
          const runsFileName = `${baseName}-runs.csv`;
          const summaryFileName = `${baseName}-summary.csv`;

          // Create parent directories if they don't exist
          const runsDir = dirname(runsFileName);
          const summaryDir = dirname(summaryFileName);
          if (runsDir !== ".") {
            mkdirSync(runsDir, { recursive: true });
          }
          if (summaryDir !== ".") {
            mkdirSync(summaryDir, { recursive: true });
          }

          writeFileSync(runsFileName, data.runs, "utf8");
          writeFileSync(summaryFileName, data.summary, "utf8");

          setOutputPath([runsFileName, summaryFileName]);
        } else {
          // Handle single-file export (JSON, Markdown)
          const extension = options.format === "md" ? "md" : options.format;
          const fileName =
            options.out || `reval-export-${eval_id.slice(0, 8)}.${extension}`;

          // Create parent directories if they don't exist
          const dir = dirname(fileName);
          if (dir !== ".") {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(fileName, data as string, "utf8");

          setOutputPath(fileName);
        }

        setStatus("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    performExport();
  }, [eval_id, options.format, options.out]);

  if (status === "exporting") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Exporting eval {eval_id}...</Text>
        <Text color="gray">Format: {options.format.toUpperCase()}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error exporting eval:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use 'reval list' to see available evals</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Export completed!</Text>
      <Text></Text>
      <Text>
        <Text bold>Eval ID:</Text> {eval_id}
      </Text>
      <Text>
        <Text bold>Format:</Text> {options.format.toUpperCase()}
      </Text>
      {Array.isArray(outputPath) ? (
        <>
          <Text>
            <Text bold>Output files:</Text>
          </Text>
          {outputPath.map((path, index) => (
            <Text key={index}> - {path}</Text>
          ))}
        </>
      ) : (
        <Text>
          <Text bold>Output file:</Text> {outputPath}
        </Text>
      )}
      <Text></Text>
      <Text color="gray">
        {Array.isArray(outputPath)
          ? "Files saved successfully"
          : "File saved successfully"}
      </Text>
      {options.format === "csv" && Array.isArray(outputPath) && (
        <Text color="gray">
          CSV export includes separate files for run data and summary analysis
        </Text>
      )}
      {options.format === "md" && (
        <Text color="gray">
          Markdown export includes comprehensive analysis with chart summaries
        </Text>
      )}
    </Box>
  );
}
