import type { Expense, ExpenseListQuery } from '@expense-tracker/shared';
import { parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Receipt, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router';
import { DateRangePicker } from '@/components/date-picker';
import { AddExpenseButton } from '@/components/expenses/add-expense-button';
import { DeleteExpenseDialog } from '@/components/expenses/delete-expense-dialog';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { ExpenseTable } from '@/components/expenses/expense-table';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useExpenseSummary, useExpenses } from '@/hooks/use-expenses';
import { formatCurrency, toIsoDate } from '@/lib/format';

const PAGE_SIZE = 15;
type SortField = NonNullable<ExpenseListQuery['sort']>;
type SortOrder = NonNullable<ExpenseListQuery['order']>;

export function TransactionsPage() {
  // Filters live in the URL so a filtered view can be bookmarked or shared.
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('category') ?? undefined;
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const q = params.get('q') ?? undefined;
  const sort = (params.get('sort') as SortField | null) ?? 'date';
  const order = (params.get('order') as SortOrder | null) ?? 'desc';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const [search, setSearch] = useState(q ?? '');
  const debouncedSearch = useDebouncedValue(search.trim());
  useEffect(() => {
    if (debouncedSearch !== (q ?? '')) updateParams({ q: debouncedSearch || undefined });
    // Only react to the debounced value, not to every URL change.
  }, [debouncedSearch]);

  const filters = { categoryId, from, to, q };
  const hasFilters = Object.values(filters).some(Boolean);
  const { data: categories = [] } = useCategories();
  const expenses = useExpenses({ ...filters, sort, order, page, pageSize: PAGE_SIZE });
  const summary = useExpenseSummary(filters);
  const pagination = expenses.data?.pagination;

  const [editing, setEditing] = useState<Expense | undefined>();
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const dateRange: DateRange | undefined = from
    ? { from: parseISO(from), to: to ? parseISO(to) : undefined }
    : undefined;

  const clearFilters = () => {
    setSearch('');
    updateParams({ category: undefined, from: undefined, to: undefined, q: undefined });
  };

  const firstRow = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const lastRow = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : 0;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Search, filter and manage your expenses."
        actions={<AddExpenseButton />}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_260px_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search descriptions…"
            aria-label="Search descriptions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryId ?? 'all'}
          onValueChange={(value) => updateParams({ category: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          value={dateRange}
          onChange={(range) =>
            updateParams({
              from: range?.from && toIsoDate(range.from),
              to: range?.to && toIsoDate(range.to),
            })
          }
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {summary.data && !summary.isError && (
          <>
            <span className="tabular font-medium text-foreground">{formatCurrency(summary.data.totalCents)}</span>{' '}
            across {summary.data.count} {summary.data.count === 1 ? 'transaction' : 'transactions'}
            {hasFilters && ' matching your filters'}
          </>
        )}
      </p>

      <Card className="py-0">
        <ExpenseTable
          expenses={expenses.data?.data}
          loading={expenses.isPending}
          sort={sort}
          order={order}
          onSortChange={(nextSort, nextOrder) => updateParams({ sort: nextSort, order: nextOrder })}
          onEdit={setEditing}
          onDelete={setDeleting}
          empty={
            expenses.isError ? (
              <QueryError message="We couldn’t load your transactions." onRetry={() => void expenses.refetch()} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Receipt className="size-5 text-muted-foreground" />
                </span>
                <div>
                  <p className="font-medium">{hasFilters ? 'No matching transactions' : 'No transactions yet'}</p>
                  <p className="text-sm text-muted-foreground">
                    {hasFilters
                      ? 'Try a different search or clear your filters.'
                      : 'Add your first expense to get started.'}
                  </p>
                </div>
                {hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <AddExpenseButton />
                )}
              </div>
            )
          }
        />
      </Card>

      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="tabular">
            {firstRow}–{lastRow} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateParams({ page: String(pagination.page - 1) }, false)}
            >
              <ChevronLeft /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(pagination.page + 1) }, false)}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      <ExpenseFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        expense={editing}
      />
      <DeleteExpenseDialog expense={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
