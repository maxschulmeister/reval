import { createDb } from "@reval/core";
import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import zod from "zod";

export const options = zod.object({
  force: zod
    .boolean()
    .optional()
    .describe("Skip confirmation and overwrite any existing database"),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function Create({ options }: Props) {
  const [status, setStatus] = useState<"creating" | "completed" | "error">(
    "creating",
  );
  const [error, setError] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await createDb(options.force);
        setCreatedFiles([".reval/reval.db"]);
        setStatus("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
  }, [options.force]);

  if (status === "creating") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Creating database and configuration files...</Text>
        {options.force && (
          <Text color="yellow">Force mode: overwriting existing files</Text>
        )}
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error creating database:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use --force to overwrite existing files</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">
        Database and configuration created successfully!
      </Text>
      <Text></Text>
      <Text bold>Created files:</Text>
      {createdFiles.map((file, index) => (
        <Text key={index} color="gray">
          • {file}
        </Text>
      ))}
      <Text></Text>
      <Text color="gray">
        You can now run 'reval run' to execute benchmarks
      </Text>
      <Text color="gray">
        Use 'reval db studio' to explore the database in Prisma Studio
      </Text>
    </Box>
  );
}
