import type { ResultPromise } from "execa";
import { execa } from "execa";
import path from "path";
import { useEffect, useRef } from "react";

export default function UI() {
  const childProcessRef = useRef<ResultPromise | null>(null);

  useEffect(() => {
    const startUI = async () => {
      try {
        // Get the correct path to the UI package
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const uiPath = path.resolve(currentDir, "../../../ui");

        console.log("CWD", process.cwd());

        // Start the UI dev server and inherit stdio to pipe all output
        const child = execa("npm", ["run", "dev"], {
          cwd: uiPath,
          stdio: "inherit",
          env: {
            ...process.env,
            REVAL_PROJECT_ROOT: process.cwd(),
          },
        });

        childProcessRef.current = child;

        // Wait for the process to complete
        await child;
      } catch (err: any) {
        // Process was likely killed, which is expected
        if (err.signal !== "SIGTERM" && err.signal !== "SIGINT") {
          console.error("Error starting UI:", err);
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

    startUI();

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
