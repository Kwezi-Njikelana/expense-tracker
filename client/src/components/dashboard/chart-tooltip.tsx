export function ChartTooltip({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <div className="text-muted-foreground">{title}</div>
      <div className="tabular font-medium">{children}</div>
    </div>
  );
}
