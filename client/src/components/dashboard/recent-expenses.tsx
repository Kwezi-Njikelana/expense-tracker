import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { CategoryIcon } from '@/components/expenses/category-badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses } from '@/hooks/use-expenses';
import { formatCurrency, formatDate } from '@/lib/format';

export function RecentExpenses() {
  const { data, isPending } = useExpenses({ pageSize: 6 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Your latest spending</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">
              View all <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : data?.data.length ? (
          <ul className="divide-y">
            {data.data.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CategoryIcon category={expense.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.category.name} · {formatDate(expense.date)}
                  </p>
                </div>
                <span className="tabular text-sm font-medium">{formatCurrency(expense.amountCents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet. Add your first expense to get started.</p>
        )}
      </CardContent>
    </Card>
  );
}
