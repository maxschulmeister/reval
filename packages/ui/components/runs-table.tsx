"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Run } from "@reval/core";

export function RunsTable() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch("/api/runs");
        if (!response.ok) {
          throw new Error("Failed to fetch runs");
        }
        const data = await response.json();
        setRuns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVariantCount = (variants: unknown) => {
    if (Array.isArray(variants)) {
      return variants.length;
    }
    if (typeof variants === "object" && variants !== null) {
      return Object.keys(variants).length;
    }
    return 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading runs...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No benchmark runs found. Run some benchmarks to see results here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmark Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run Name</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <Link
                    href={`/run/${run.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {run.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {run.function}
                </TableCell>
                <TableCell>{getVariantCount(run.variants)}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatTimestamp(run.timestamp)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {run.notes || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}