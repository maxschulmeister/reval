import { redirect } from "next/navigation";

async function getLatestEval() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/evals`,
      {
        cache: "no-store",
      },
    );
    const evals = await response.json();
    return evals.length > 0 ? evals[evals.length - 1] : null;
  } catch (error) {
    console.error("Error fetching evals:", error);
    return null;
  }
}

export default async function EvalRedirectPage() {
  const latestEval = await getLatestEval();

  if (latestEval) {
    redirect(`/eval/${latestEval.id}`);
  }

  // If no evals available, show error state
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">No Evals Available</h1>
        <p className="text-muted-foreground">There are no evals to display.</p>
      </div>
    </div>
  );
}
