export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Run Not Found</h1>
        <p className="text-muted-foreground">
          The requested run could not be found.
        </p>
      </div>
    </div>
  );
}
