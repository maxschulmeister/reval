import { execa } from "execa";
import { Box, Text } from "ink";
import { useEffect, useState } from "react";

export default function Studio() {
  const [status, setStatus] = useState<"starting" | "running" | "error">(
    "starting",
  );
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const configPath = require.resolve("@reval/core/drizzle.config.ts");

  useEffect(() => {
    const startStudio = async () => {
      try {
        // Launch Drizzle Studio for the local database
        const child = execa(
          "npx",
          ["drizzle-kit", "studio", `--config=${configPath}`],
          {
            cwd: process.cwd(),
            detached: true,
          },
        );

        // Wait for the process to start or fail
        await new Promise((resolve, reject) => {
          child.on("error", reject);
          setTimeout(resolve, 2000); // Give it time to start
        });

        setUrl("https://local.drizzle.studio");
        setStatus("running");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    startStudio();
  }, []);

  if (status === "starting") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Starting Drizzle Studio...</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error starting Drizzle Studio:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Make sure drizzle-kit is installed</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Drizzle Studio started!</Text>
      <Text></Text>
      <Text>
        <Text bold>URL:</Text> {url}
      </Text>
      <Text></Text>
      <Text color="gray">Studio is running in the background</Text>
      <Text color="gray">
        Press Ctrl+C to stop this command (Studio will continue running)
      </Text>
    </Box>
  );
}
