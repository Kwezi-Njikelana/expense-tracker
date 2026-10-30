import type { Expense, ExpenseListQuery } from '@expense-tracker/shared';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './category-badge';

type SortField = NonNullable<ExpenseListQuery['sort']>;
type SortOrder = NonNullable<ExpenseListQuery['order']>;

interface ExpenseTableProps {
  expenses: Expense[] | undefined;
  loading: boolean;
  sort: SortField;
  order: SortOrder;
  onSortChange: (sort: SortField, order: SortOrder) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  empty: React.ReactNode;
}

export function ExpenseTable({ expenses, loading, sort, order, onSortChange, onEdit, onDelete, empty }: ExpenseTableProps) {
  const sortHeader = (field: SortField, label: string, className?: string) => {
    const active = sort === field;
    const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <Button
          variant="ghost"
          size="sm"
          className={cn('-mx-2.5 text-muted-foreground', active && 'text-foreground')}
          onClick={() => onSortChange(field, active && order === 'desc' ? 'asc' : 'desc')}
        >
          {label}
          <Icon className="size-3.5" />
        </Button>
      </TableHead>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {sortHeader('date', 'Date', 'w-36')}
          {sortHeader('description', 'Description')}
          <TableHead className="hidden md:table-cell">Category</TableHead>
          {sortHeader('amount', 'Amount', 'text-right [&>button]:ml-auto [&>button]:flex')}
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 8 }, (_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={5}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ))
        ) : expenses?.length ? (
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
              <TableCell className="max-w-0 w-full">
                <p className="truncate font-medium">{expense.description}</p>
                <p className="text-xs text-muted-foreground md:hidden">{expense.category.name}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <CategoryBadge category={expense.category} />
              </TableCell>
              <TableCell className="tabular text-right font-medium">{formatCurrency(expense.amountCents)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expense.description}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(expense)}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(expense)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={5}>{empty}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
