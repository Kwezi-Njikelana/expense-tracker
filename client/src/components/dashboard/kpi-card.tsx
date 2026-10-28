import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  footer?: React.ReactNode;
  loading?: boolean;
}

export function KpiCard({ label, value, icon: Icon, footer, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {label}
          <Icon className="size-4" />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="tabular truncate text-2xl font-semibold tracking-tight">{value}</div>
        )}
        <div className="min-h-5 text-sm text-muted-foreground">{loading ? <Skeleton className="h-4 w-24" /> : footer}</div>
      </CardContent>
    </Card>
  );
}
