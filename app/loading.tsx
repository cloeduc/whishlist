export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-base border-2 border-border bg-secondary-background shadow-shadow" />
      <div className="h-24 w-full animate-pulse rounded-base border-2 border-border bg-secondary-background shadow-shadow" />
      <div className="h-24 w-full animate-pulse rounded-base border-2 border-border bg-secondary-background shadow-shadow" />
    </div>
  );
}
