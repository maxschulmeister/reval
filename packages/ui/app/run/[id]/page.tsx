"use client";

import { ExecutionsCharts } from "@/components/executions-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Execution, Run } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface RunData {
  run: Run;
  executions: Execution[];
}

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRunData = async () => {
      try {
        const response = await fetch(`/api/runs/${runId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch run data");
        }
        const runData = await response.json();
        setData(runData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (runId) {
      fetchRunData();
    }
  }, [runId]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSuccessRate = (executions: Execution[]) => {
    if (executions.length === 0) return 0;
    const successCount = executions.filter(
      (exec) => exec.status === "success"
    ).length;
    return Math.round((successCount / executions.length) * 100);
  };

  const getAverageExecutionTime = (executions: Execution[]) => {
    if (executions.length === 0) return 0;
    const totalTime = executions.reduce((sum, exec) => sum + exec.time, 0);
    return Math.round(totalTime / executions.length);
  };

  const getPredictionFromResult = (result: unknown) => {
    if (
      typeof result === "object" &&
      result !== null &&
      "prediction" in result
    ) {
      return String((result as { prediction: unknown }).prediction);
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-gray-500">Loading run data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error: {error || "Run not found"}
        </div>
      </div>
    );
  }

  const { run, executions } = data;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Runs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {run.name}
        </h1>
        <p className="text-gray-600 mt-2">Run details and execution results</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Run Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Run Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Function</div>
              <div className="font-mono text-sm">{run.function}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Timestamp</div>
              <div className="text-sm">{formatTimestamp(run.timestamp)}</div>
            </div>
            {run.notes && (
              <div>
                <div className="text-sm font-medium text-gray-500">Notes</div>
                <div className="text-sm">{run.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">
                Total Executions
              </div>
              <div className="text-2xl font-bold">{executions.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Success Rate
              </div>
              <div className="text-2xl font-bold text-green-600">
                {getSuccessRate(executions)}%
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Avg Execution Time
              </div>
              <div className="text-2xl font-bold">
                {getAverageExecutionTime(executions)}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <ExecutionsCharts executions={executions} />
      </div>

      {/* Executions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Execution Time</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Prediction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-mono text-sm">
                    {JSON.stringify(execution.variant)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        execution.status === "success"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {execution.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{execution.time}ms</TableCell>
                  <TableCell>{execution.retries}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getPredictionFromResult(execution.result)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
