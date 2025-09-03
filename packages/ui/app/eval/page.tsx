"use client";

import { useLatestEval } from "@/app/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EvalRedirectPage() {
  const router = useRouter();
  const { latestEval, isLoading, isError } = useLatestEval();

  useEffect(() => {
    if (latestEval) {
      router.push(`/eval/${latestEval.id}`);
    }
  }, [latestEval, router]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-muted-foreground">Loading latest eval...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Error Loading Evals</h1>
          <p className="text-muted-foreground">
            Failed to load eval data. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // If no evals available, show error state
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">No Evals Available</h1>
        <p className="text-muted-foreground">
          There are no evals to display. New evals will appear automatically
          when created.
        </p>
      </div>
    </div>
  );
}
