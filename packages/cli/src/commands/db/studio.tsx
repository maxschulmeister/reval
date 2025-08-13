import type { ResultPromise } from "execa";
import { execa } from "execa";
import { useEffect, useRef } from "react";
import { drizzleConfigPath } from "@reval/core";

export default function Studio() {
  const childProcessRef = useRef<ResultPromise | null>(null);

  useEffect(() => {
    const startStudio = async () => {
      try {
        // Use the drizzle config path exported from core
        const child = execa(
          "npx",
          ["drizzle-kit", "studio", `--config=${drizzleConfigPath}`],
          {
            cwd: process.cwd(),
            stdio: "inherit",
          },
        );

        childProcessRef.current = child;

        // Wait for the process to complete
        await child;
      } catch (err: any) {
        // Process was likely killed, which is expected
        if (err.signal !== "SIGTERM" && err.signal !== "SIGINT") {
          console.error("Error starting Drizzle Studio:", err);
        }
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

    startStudio();

    return () => {
      cleanup();
      process.off("SIGINT", cleanup);
      process.off("SIGTERM", cleanup);
      process.off("exit", cleanup);
    };
  }, []);

  // Return null since we're not rendering anything - output is inherited
  return null;
}
