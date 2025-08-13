import type { ResultPromise } from "execa";
import { execa } from "execa";
import { useEffect, useRef } from "react";
import { dbPath } from "@reval/core";
import fs from "fs";
import path from "path";

export default function Studio() {
  const childProcessRef = useRef<ResultPromise | null>(null);

  useEffect(() => {
    const startStudio = async () => {
      try {
        // Create a temporary drizzle config file in the current working directory
        const configPath = path.join(process.cwd(), `drizzle.config.temp.${Date.now()}.cjs`);
        
        const configContent = `
const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: "${dbPath}",
  },
});
`;

        fs.writeFileSync(configPath, configContent);

        // Launch Drizzle Studio and inherit stdio to pipe all output
        const child = execa(
          "npx",
          ["drizzle-kit", "studio", `--config=${configPath}`],
          {
            cwd: process.cwd(),
            stdio: "inherit",
          },
        );

        childProcessRef.current = child;

        // Clean up temp file after a delay
        setTimeout(() => {
          try {
            fs.unlinkSync(configPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 5000);

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
