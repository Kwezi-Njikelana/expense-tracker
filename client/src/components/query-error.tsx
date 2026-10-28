import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QueryError({ message = 'Something went wrong loading this data.', onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw /> Try again
      </Button>
    </div>
  );
}
