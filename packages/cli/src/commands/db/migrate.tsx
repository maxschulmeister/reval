import { migrateDb } from "@reval/core";
import { Box, Text } from "ink";
import { useEffect, useState } from "react";

export default function Migrate() {
  const [status, setStatus] = useState<"migrating" | "completed" | "error">(
    "migrating",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await migrateDb();
        setStatus("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
  }, []);

  if (status === "migrating") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Running database migrations...</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error running migrations:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">
          Ensure the database exists and migration files are available
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Database migrations completed!</Text>
      <Text></Text>
      <Text color="gray">Database schema is now up to date</Text>
    </Box>
  );
}
