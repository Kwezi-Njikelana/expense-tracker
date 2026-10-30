import type { CategoryTotal } from '@expense-tracker/shared';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryIcon } from '@/components/expenses/category-badge';
import { formatCurrency } from '@/lib/format';
import { ChartTooltip } from './chart-tooltip';

export function CategoryBreakdown({ data, totalCents }: { data: CategoryTotal[]; totalCents: number }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No spending in this period.</p>;
  }

  return (
    <div className="@container">
      <div className="grid items-center gap-6 @md:grid-cols-[180px_1fr]">
        <div className="relative mx-auto size-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="totalCents"
                nameKey="name"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                cornerRadius={4}
                stroke="none"
              >
                {data.map((category) => (
                  <Cell key={category.categoryId} fill={category.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const category = payload?.[0]?.payload as CategoryTotal | undefined;
                  if (!active || !category) return null;
                  return <ChartTooltip title={category.name}>{formatCurrency(category.totalCents)}</ChartTooltip>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="tabular text-sm font-semibold">{formatCurrency(totalCents)}</span>
          </div>
        </div>

        <ul className="space-y-3">
          {data.map((category) => {
            const share = totalCents > 0 ? (category.totalCents / totalCents) * 100 : 0;
            return (
              <li key={category.categoryId} className="flex items-center gap-3">
                <CategoryIcon category={category} className="size-8" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{category.name}</span>
                    <span className="tabular shrink-0">{formatCurrency(category.totalCents)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: category.color }}
                      />
                    </div>
                    <span className="tabular w-10 text-right text-xs text-muted-foreground">{share.toFixed(0)}%</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
