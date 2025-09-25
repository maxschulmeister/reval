import { coreRoot, createDb, DATA_DIR, NAMESPACE } from "@reval/core";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import fs from "fs/promises";
import { Box, Text } from "ink";
import path from "path";
import { useEffect, useState } from "react";
import zod from "zod";

export const options = zod.object({
  force: zod
    .boolean()
    .optional()
    .describe("Skip confirmation and overwrite existing files and database"),
});

interface Props {
  options: zod.infer<typeof options>;
}

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
        const configName = `${NAMESPACE}.config.ts`;
        const configExists = existsSync(configName);
        const dataDirExists = existsSync(DATA_DIR);

        if (configExists && !options.force) {
          throw new Error(
            "Configuration file already exists. Use --force to overwrite.",
          );
        }

        // Create config file
        if (!configExists || options.force) {
          copyFileSync(path.resolve(coreRoot, configName), configName);
          files.push(configName);
        }

        // Create data directory and sample data
        if (!dataDirExists) {
          mkdirSync(DATA_DIR, { recursive: true });
        }

        // Always create sample (overwrite if exists)
        copyFileSync(
          path.resolve(coreRoot, "sample.json"),
          path.resolve("sample.json"),
        );
        files.push(path.resolve("sample.json"));

        // Initialize database in current working directory
        await createDb(options.force);
        files.push(path.resolve(`.${NAMESPACE}`, `${NAMESPACE}.db (database)`));

        const tsConfigPath = path.resolve(coreRoot, "tsconfig.json");
        const tsConfig = {
          extends: tsConfigPath,
          compilerOptions: {
            resolveJsonModule: true,
            esModuleInterop: true,
          },
          include: [`${NAMESPACE}.config.ts`],
        };
        await fs.writeFile(
          path.resolve(coreRoot, `tsconfig.${NAMESPACE}.json`),
          JSON.stringify(tsConfig, null, 2),
        );

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
        3. Run 'reval eval' to execute your first benchmark
      </Text>
      <Text color="blue">
        4. Use 'reval ui' to explore results in the web interface
      </Text>
      <Text></Text>
      <Text color="gray">Happy benchmarking! 🎯</Text>
    </Box>
  );
}
