import { endOfMonth, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { Hash, TrendingDown, TrendingUp, Trophy, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';
import { SpendingTrendChart } from '@/components/dashboard/spending-trend-chart';
import { AddExpenseButton } from '@/components/expenses/add-expense-button';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/use-auth';
import { useExpenseSummary } from '@/hooks/use-expenses';
import { formatCurrency, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const periods = {
  month: { label: 'This month', from: (today: Date) => startOfMonth(today) },
  quarter: { label: '3 months', from: (today: Date) => startOfMonth(subMonths(today, 2)) },
  year: { label: 'This year', from: (today: Date) => startOfYear(today) },
  all: { label: 'All time', from: () => undefined },
} as const;

type Period = keyof typeof periods;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const [period, setPeriod] = useState<Period>('month');

  const today = useMemo(() => new Date(), []);
  const periodFrom = periods[period].from(today);
  const summary = useExpenseSummary({ from: periodFrom && toIsoDate(periodFrom) });
  const trend = useExpenseSummary({
    from: toIsoDate(startOfMonth(subMonths(today, 11))),
    to: toIsoDate(endOfMonth(today)),
  });

  const months = trend.data?.monthly ?? [];
  const thisMonth = months.at(-1)?.totalCents ?? 0;
  const lastMonth = months.at(-2)?.totalCents ?? 0;
  const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
  const topCategory = summary.data?.byCategory[0];
  const periodLabel = periods[period].label.toLowerCase();

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ')[0]}`}
        description="Here’s how your spending is looking."
        actions={<AddExpenseButton />}
      />

      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="mb-6">
        <TabsList>
          {Object.entries(periods).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {summary.isError || trend.isError ? (
        <Card>
          <QueryError
            message="We couldn’t load your spending summary."
            onRetry={() => {
              void summary.refetch();
              void trend.refetch();
            }}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total spent"
              icon={Wallet}
              loading={summary.isPending}
              value={formatCurrency(summary.data?.totalCents ?? 0)}
              footer={periods[period].label}
            />
            <KpiCard
              label="This month"
              icon={change !== null && change < 0 ? TrendingDown : TrendingUp}
              loading={trend.isPending}
              value={formatCurrency(thisMonth)}
              footer={
                change === null ? (
                  'No spending last month'
                ) : (
                  <>
                    <span
                      className={cn(
                        'font-medium',
                        change > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}%
                    </span>{' '}
                    vs last month
                  </>
                )
              }
            />
            <KpiCard
              label="Transactions"
              icon={Hash}
              loading={summary.isPending}
              value={summary.data?.count ?? 0}
              footer={`Average ${formatCurrency(summary.data?.averageCents ?? 0)}`}
            />
            <KpiCard
              label="Top category"
              icon={Trophy}
              loading={summary.isPending}
              value={topCategory?.name ?? '—'}
              footer={
                topCategory && summary.data
                  ? `${formatCurrency(topCategory.totalCents)} · ${Math.round((topCategory.totalCents / summary.data.totalCents) * 100)}% of spending`
                  : 'Nothing spent yet'
              }
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Monthly spending</CardTitle>
                <CardDescription>Last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {trend.isPending ? <Skeleton className="h-[260px] w-full" /> : <SpendingTrendChart data={months} />}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>By category</CardTitle>
                <CardDescription>Where your money went, {periodLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.isPending ? (
                  <Skeleton className="h-[180px] w-full" />
                ) : (
                  <CategoryBreakdown data={summary.data?.byCategory ?? []} totalCents={summary.data?.totalCents ?? 0} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="mt-6">
        <RecentExpenses />
      </div>
    </>
  );
}
