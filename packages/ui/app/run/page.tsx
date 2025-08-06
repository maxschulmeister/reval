import { redirect } from "next/navigation";

async function getLatestRun() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/runs`, {
      cache: 'no-store'
    });
    const runs = await response.json();
    return runs.length > 0 ? runs[0] : null;
  } catch (error) {
    console.error("Error fetching runs:", error);
    return null;
  }
}

export default async function RunRedirectPage() {
  const latestRun = await getLatestRun();
  
  if (latestRun) {
    redirect(`/run/${latestRun.id}`);
  }
  
  // If no runs available, show error state
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No Runs Available</h1>
        <p className="text-muted-foreground">There are no runs to display.</p>
      </div>
    </div>
  );
}