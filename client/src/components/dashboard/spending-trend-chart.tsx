import type { MonthlyTotal } from '@expense-tracker/shared';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency, formatMonth } from '@/lib/format';
import { ChartTooltip } from './chart-tooltip';

export function SpendingTrendChart({ data }: { data: MonthlyTotal[] }) {
  const lastIndex = data.length - 1;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickFormatter={(month: string) => formatMonth(month)}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(cents: number) => formatCompactCurrency(cents)}
          tickLine={false}
          axisLine={false}
          width={64}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'var(--muted)', radius: 6 }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as MonthlyTotal | undefined;
            if (!active || !point) return null;
            return <ChartTooltip title={formatMonth(point.month, 'MMMM yyyy')}>{formatCurrency(point.totalCents)}</ChartTooltip>;
          }}
        />
        <Bar dataKey="totalCents" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((point, index) => (
            <Cell
              key={point.month}
              fill="var(--primary)"
              fillOpacity={index === lastIndex ? 1 : 0.35}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
