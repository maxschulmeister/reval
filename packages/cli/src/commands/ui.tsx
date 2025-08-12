import type { ResultPromise } from "execa";
import { execa } from "execa";
import { Box, Text } from "ink";
import path from "path";
import React, { useEffect, useRef, useState } from "react";

export default function UI() {
  const [status, setStatus] = useState<"starting" | "running" | "error">(
    "starting",
  );
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const childProcessRef = useRef<ResultPromise | null>(null);

  useEffect(() => {
    const startUI = async () => {
      try {
        // Get the correct path to the UI package
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const uiPath = path.resolve(currentDir, "../../../ui");

        // Start the UI dev server
        const child = execa("npm", ["run", "dev"], {
          cwd: uiPath,
          stdio: ["ignore", "pipe", "pipe"],
        });

        childProcessRef.current = child;

        // Wait for the process to start
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve(undefined);
          }, 5000);

          child.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });

          // Listen for output that indicates the server is ready
          child.stdout?.on("data", (data) => {
            const output = data.toString();
            if (output.includes("Ready in") || output.includes("Local:")) {
              clearTimeout(timeout);
              resolve(undefined);
            }
          });
        });

        setUrl("http://localhost:3000");
        setStatus("running");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    // Cleanup function to kill the process when component unmounts
    const cleanup = () => {
      if (childProcessRef.current && !childProcessRef.current.killed) {
        childProcessRef.current.kill("SIGTERM");
      }
    };

    // Handle process termination signals
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);

    startUI();

    return () => {
      cleanup();
      process.off("SIGINT", cleanup);
      process.off("SIGTERM", cleanup);
      process.off("exit", cleanup);
    };
  }, []);

  if (status === "starting") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Starting reval UI...</Text>
        <Text color="gray">This may take a moment...</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error starting UI:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">
          Make sure the UI package is available and dependencies are installed
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">reval UI started!</Text>
      <Text></Text>
      <Text>
        <Text bold>URL:</Text> {url}
      </Text>
      <Text></Text>
      <Text color="gray">
        Open this URL in your browser to explore benchmark results
      </Text>
      <Text color="yellow">
        Server is running... Press Ctrl+C to stop the server and exit
      </Text>
    </Box>
  );
}
