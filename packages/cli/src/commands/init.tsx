import { createDatabase } from "@reval/core";
import fs, { existsSync, mkdirSync, writeFileSync } from "fs";
import { Box, Text } from "ink";
import path from "path";
import { useEffect, useState } from "react";
import zod from "zod";
import { DEFAULT_SAMPLE_CSV } from "../utils/index.js";

export const options = zod.object({
  force: zod
    .boolean()
    .optional()
    .describe("Skip confirmation and overwrite existing files and database"),
});

interface Props {
  options: zod.infer<typeof options>;
}

const getDefaultConfig = () => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  // When compiled, we need to look for the .js file, not .ts
  const defaultConfigPath = path.join(currentDir, "../reval.config.default.js");
  try {
    return fs.readFileSync(defaultConfigPath, "utf8");
  } catch (error) {
    // Fallback to inline config if file doesn't exist
    throw new Error(`Failed to read default config file: ${defaultConfigPath}`);
  }
};

const getSampleData = () => {
  return DEFAULT_SAMPLE_CSV;
};

export default function Init({ options }: Props) {
  const [status, setStatus] = useState<"initializing" | "completed" | "error">(
    "initializing",
  );
  const [error, setError] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const files: string[] = [];

        // Check for existing files
        const configExists = existsSync("reval.config.ts");
        const dataDir = "data";
        const dataDirExists = existsSync(dataDir);

        if (configExists && !options.force) {
          throw new Error(
            "Configuration file already exists. Use --force to overwrite.",
          );
        }



        // Create config file
        if (!configExists || options.force) {
          const configContent = getDefaultConfig();
          writeFileSync("reval.config.ts", configContent, "utf8");
          files.push("reval.config.ts");
        }

        // Create data directory and sample data
        if (!dataDirExists) {
          mkdirSync(dataDir, { recursive: true });
        }

        // Always create sample.csv (overwrite if exists)
        writeFileSync("data/sample.csv", getSampleData(), "utf8");
        files.push("data/sample.csv");

        // Initialize database in current working directory
        await createDatabase(options.force);
        files.push(".reval/reval.db (database)");

        setCreatedFiles(files);
        setStatus("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    initialize();
  }, [options.force]);

  if (status === "initializing") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Initializing reval project...</Text>
        {options.force && (
          <Text color="yellow">Force mode: overwriting existing files</Text>
        )}
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error initializing project:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use --force to overwrite existing files</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Project initialized successfully!</Text>
      <Text></Text>
      <Text bold>Created files:</Text>
      {createdFiles.map((file, index) => (
        <Text key={index} color="gray">
          {" "}
          • {file}
        </Text>
      ))}
      <Text></Text>
      <Text bold>Next steps:</Text>
      <Text color="blue">
        1. Edit reval.config.ts to customize your benchmark
      </Text>
      <Text color="blue">2. Update data/sample.csv with your test data</Text>
      <Text color="blue">
        3. Run 'reval run' to execute your first benchmark
      </Text>
      <Text color="blue">
        4. Use 'reval ui' to explore results in the web interface
      </Text>
      <Text></Text>
      <Text color="gray">Happy benchmarking! 🎯</Text>
    </Box>
  );
}
