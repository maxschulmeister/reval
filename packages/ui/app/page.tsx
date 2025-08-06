"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Run } from "@reval/core";
import { calculateSuccessRate, calculateAverageTime, categorizeValue } from "../lib/grouping";
import { MultiSelect, type Option } from "../components/multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";

type Execution = {
  id: string;
  runId: string;
  features: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | string;
  result: Record<string, unknown> | string;
  time: number;
  retries: number;
  status: string;
  variant: Record<string, unknown>;
};

type RunWithExecutions = {
  run: Run;
  executions: Execution[];
};

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [runData, setRunData] = useState<RunWithExecutions | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantFilters, setVariantFilters] = useState<Record<string, string[]>>({});
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>({});
  const [dialogContent, setDialogContent] = useState<{ type: 'target' | 'prediction', content: string } | null>(null);

  // Fetch all runs on component mount
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch("/api/runs");
        const data = await response.json();
        setRuns(data);
        if (data.length > 0) {
          setSelectedRunId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching runs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  // Fetch run details when selected run changes
  useEffect(() => {
    if (!selectedRunId) return;
    
    const fetchRunData = async () => {
      try {
        const response = await fetch(`/api/runs/${selectedRunId}`);
        const data = await response.json();
        setRunData(data);
        
        // Initialize variant filters
        if (data.run.variants) {
          const filters: Record<string, string[]> = {};
          Object.keys(data.run.variants).forEach(key => {
            filters[key] = [];
          });
          setVariantFilters(filters);
        }
      } catch (error) {
        console.error("Error fetching run data:", error);
      }
    };
    fetchRunData();
  }, [selectedRunId]);

  const handleRunChange = (runId: string) => {
    setSelectedRunId(runId);
    setVariantFilters({});
    setStatusFilter([]);
    setSortColumn("");
    setCollapsedCells({});
  };

  const handleVariantFilterChange = (variantKey: string, values: string[]) => {
    setVariantFilters(prev => ({ ...prev, [variantKey]: values }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleCollapse = (cellId: string) => {
    setCollapsedCells(prev => ({ ...prev, [cellId]: !prev[cellId] }));
  };

  const openDialog = (type: 'target' | 'prediction', content: string) => {
    setDialogContent({ type, content });
  };

  const closeDialog = () => {
    setDialogContent(null);
  };

  // Filter executions based on current filters
  const filteredExecutions = runData?.executions.filter(execution => {
    // Status filter
    if (statusFilter.length > 0 && !statusFilter.includes(execution.status)) {
      return false;
    }
    
    // Variant filters
    for (const [variantKey, selectedValues] of Object.entries(variantFilters)) {
      if (selectedValues.length > 0) {
        const executionVariantValue = execution.variant[variantKey];
        if (!selectedValues.includes(String(executionVariantValue))) {
          return false;
        }
      }
    }
    
    return true;
  }) || [];

  // Sort executions
  const sortedExecutions = [...filteredExecutions].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: unknown;
    let bValue: unknown;
    
    if (sortColumn.startsWith("variant.")) {
      const variantKey = sortColumn.replace("variant.", "");
      aValue = typeof a.variant === 'object' && a.variant !== null && !Array.isArray(a.variant)
        ? (a.variant as Record<string, unknown>)[variantKey]
        : '';
      bValue = typeof b.variant === 'object' && b.variant !== null && !Array.isArray(b.variant)
        ? (b.variant as Record<string, unknown>)[variantKey]
        : '';
    } else if (sortColumn.startsWith("features.")) {
      const featureKey = sortColumn.replace("features.", "");
      if (Array.isArray(a.features)) {
        const index = parseInt(featureKey.replace("feature_", ""));
        aValue = a.features[index];
      } else if (typeof a.features === 'object' && a.features !== null) {
        aValue = (a.features as Record<string, unknown>)[featureKey];
      } else {
        aValue = a.features;
      }
      
      if (Array.isArray(b.features)) {
        const index = parseInt(featureKey.replace("feature_", ""));
        bValue = b.features[index];
      } else if (typeof b.features === 'object' && b.features !== null) {
        bValue = (b.features as Record<string, unknown>)[featureKey];
      } else {
        bValue = b.features;
      }
    } else {
      aValue = a[sortColumn as keyof Execution];
      bValue = b[sortColumn as keyof Execution];
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue || "");
    const bStr = String(bValue || "");
    
    if (sortDirection === "asc") {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Get unique values for variant filters
  const getUniqueVariantValues = (variantKey: string): string[] => {
    if (!runData) return [];
    const values = runData.executions.map(e => String(e.variant[variantKey] || ""));
    return [...new Set(values)].filter(Boolean);
  };

  // Get unique status values
  const getUniqueStatusValues = (): string[] => {
    if (!runData) return [];
    const values = runData.executions.map(e => e.status);
    return [...new Set(values)].filter(Boolean);
  };

  // Get dynamic feature columns
  const getFeatureColumns = (): string[] => {
    if (!runData?.executions.length) return [];
    const firstExecution = runData.executions[0];
    if (Array.isArray(firstExecution.features)) {
      return firstExecution.features.map((_, index) => `feature_${index}`);
    }
    if (typeof firstExecution.features === "object" && firstExecution.features) {
      return Object.keys(firstExecution.features);
    }
    return ["features"];
  };

  const renderSortArrow = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const renderCollapsibleContent = (content: unknown, cellId: string, type: 'target' | 'prediction') => {
    const contentStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    
    return (
      <div>
        <Button 
          onClick={() => openDialog(type, contentStr)}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          View {type}
        </Button>
      </div>
    );
  };

  if (loading) {
    return <div>Loading runs...</div>;
  }

  if (runs.length === 0) {
    return <div>No runs found.</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="flex items-center gap-2">
          <label htmlFor="run-select">Select Run:</label>
          <Select value={selectedRunId} onValueChange={handleRunChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map(run => (
                <SelectItem key={run.id} value={run.id}>{run.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.open("https://www.github.com", "_blank")}
          >
            GitHub
          </Button>
          <Button 
            onClick={() => window.open("https://www.google.com", "_blank")}
          >
            Documentation
          </Button>
        </div>
      </div>

      {runData && (
        <>
          {/* Filter Section */}
          <div style={{ marginBottom: "20px", padding: "16px", border: "1px solid #ddd", backgroundColor: "#f8f9fa" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>Filters</h3>
            
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {/* Variant Filters - Only show variants with more than one option */}
              {Object.keys(runData.run.variants || {}).filter(variantKey => getUniqueVariantValues(variantKey).length > 1).map(variantKey => (
                <div key={variantKey} style={{ minWidth: "200px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>{variantKey}:</label>
                  <MultiSelect
                    options={getUniqueVariantValues(variantKey).map(value => ({ label: value, value }))}
                    selected={variantFilters[variantKey] || []}
                    onChange={(selected) => handleVariantFilterChange(variantKey, selected)}
                    placeholder={`Select ${variantKey}...`}
                  />
                </div>
              ))}
              
              {/* Status Filter - Only show if more than one status */}
              {getUniqueStatusValues().length > 1 && (
                <div style={{ minWidth: "200px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>Status:</label>
                  <MultiSelect
                    options={getUniqueStatusValues().map(status => ({ 
                      label: status.charAt(0).toUpperCase() + status.slice(1), 
                      value: status 
                    }))}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Select status..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Rows */}
          <div style={{ marginBottom: "20px" }}>
            {/* First Summary Row - Horizontal Layout */}
            <div style={{ display: "flex", gap: "24px", padding: "16px", border: "1px solid #ddd", backgroundColor: "#f8f9fa", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: "600", marginRight: "8px" }}>Function:</span>
                <span>{runData.run.function}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      Show Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-[40rem]">
                    <DialogHeader>
                      <DialogTitle>Function: {runData.run.function}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 overflow-hidden">
                      <SyntaxHighlighter 
                        language="javascript" 
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          maxWidth: '100%',
                          overflow: 'auto'
                        }}
                      >
                        {`function ${runData.run.function}() {
  // Function implementation would be shown here
  // This is a placeholder as the actual function code is not stored
}`}
                      </SyntaxHighlighter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <span style={{ fontWeight: "600", marginRight: "8px" }}>Timestamp:</span>
                <span>{new Date(runData.run.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ fontWeight: "600", marginRight: "8px" }}>Executions:</span>
                <span>{filteredExecutions.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: "600", marginRight: "8px" }}>Success Rate:</span>
                <span>{calculateSuccessRate(filteredExecutions)}%</span>
              </div>
              <div>
                <span style={{ fontWeight: "600", marginRight: "8px" }}>Avg Time:</span>
                <span>{calculateAverageTime(filteredExecutions)}ms</span>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {/* Feature columns */}
                {getFeatureColumns().map(featureCol => (
                  <TableHead 
                    key={featureCol}
                    onClick={() => handleSort(`features.${featureCol}`)}
                    className="cursor-pointer"
                  >
                    {featureCol}{renderSortArrow(`features.${featureCol}`)}
                  </TableHead>
                ))}
                
                {/* Variant columns */}
                {Object.keys(runData.run.variants || {}).map(variantKey => (
                  <TableHead 
                    key={variantKey}
                    onClick={() => handleSort(`variant.${variantKey}`)}
                    className="cursor-pointer"
                  >
                    {variantKey}{renderSortArrow(`variant.${variantKey}`)}
                  </TableHead>
                ))}
                
                <TableHead 
                  onClick={() => handleSort("target")}
                  className="cursor-pointer"
                >
                  Target{renderSortArrow("target")}
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("result")}
                  className="cursor-pointer"
                >
                  Prediction{renderSortArrow("result")}
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("time")}
                  className="cursor-pointer"
                >
                  Time{renderSortArrow("time")}
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("retries")}
                  className="cursor-pointer"
                >
                  Retries{renderSortArrow("retries")}
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("status")}
                  className="cursor-pointer"
                >
                  Status{renderSortArrow("status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExecutions.map(execution => (
                <TableRow key={execution.id}>
                  {/* Feature columns */}
                  {getFeatureColumns().map(featureCol => {
                    let value;
                    if (Array.isArray(execution.features)) {
                      const index = parseInt(featureCol.replace("feature_", ""));
                      value = execution.features[index];
                    } else if (typeof execution.features === "object" && execution.features !== null) {
                      value = (execution.features as Record<string, unknown>)[featureCol];
                    } else {
                      value = execution.features;
                    }
                    
                    return (
                      <TableCell key={featureCol}>
                        {typeof value === "object" ? JSON.stringify(value) : String(value || "")}
                      </TableCell>
                    );
                  })}
                  
                  {/* Variant columns */}
                  {Object.keys(runData.run.variants || {}).map(variantKey => (
                    <TableCell key={variantKey}>
                      {typeof execution.variant === 'object' && execution.variant !== null && !Array.isArray(execution.variant)
                        ? String((execution.variant as Record<string, unknown>)[variantKey] || "")
                        : ""}
                    </TableCell>
                  ))}
                  
                  <TableCell>
                    {renderCollapsibleContent(execution.target, `target-${execution.id}`, 'target')}
                  </TableCell>
                  <TableCell>
                    {renderCollapsibleContent(execution.result, `result-${execution.id}`, 'prediction')}
                  </TableCell>
                  <TableCell>
                    {execution.time}ms ({categorizeValue(runData?.executions.map((e: Execution) => Number(e.time)) || [], Number(execution.time))})
                  </TableCell>
                  <TableCell>
                    {execution.retries}
                  </TableCell>
                  <TableCell>
                    {execution.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredExecutions.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No executions match the current filters.
            </div>
          )}
        </>
      )}
      
      {/* Dialog for Target/Prediction */}
      <Dialog open={!!dialogContent} onOpenChange={(open) => !open && closeDialog()}>
         <DialogContent className="w-full max-w-[40rem] max-h-[80vh] overflow-auto">
           <DialogHeader>
             <DialogTitle>
               {dialogContent ? dialogContent.type.charAt(0).toUpperCase() + dialogContent.type.slice(1) : ""}
             </DialogTitle>
           </DialogHeader>
           <div className="mt-4 overflow-hidden">
             <SyntaxHighlighter 
               language="json" 
               style={tomorrow}
               customStyle={{
                 margin: 0,
                 maxWidth: '100%',
                 overflow: 'auto'
               }}
             >
               {dialogContent?.content || ""}
             </SyntaxHighlighter>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
}
