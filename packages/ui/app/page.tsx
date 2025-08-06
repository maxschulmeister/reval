import { RunsTable } from "@/components/runs-table";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Reval Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Benchmark runs and execution results
        </p>
      </div>
      <RunsTable />
    </div>
  );
}
