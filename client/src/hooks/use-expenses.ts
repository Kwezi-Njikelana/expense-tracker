import type {
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpenseListQuery,
  ExpenseSummary,
  ExpenseUpdate,
  Paginated,
} from '@expense-tracker/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQueryString } from '@/lib/api';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (query: ExpenseListQuery) => ['expenses', 'list', query] as const,
  summary: (filters: ExpenseFilters) => ['expenses', 'summary', filters] as const,
};

export function useExpenses(query: ExpenseListQuery) {
  return useQuery({
    queryKey: expenseKeys.list(query),
    queryFn: () => api.get<Paginated<Expense>>(`/expenses${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseSummary(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.summary(filters),
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary${toQueryString(filters)}`),
    placeholderData: keepPreviousData,
  });
}

// Every change can affect lists and summaries, so refresh everything under `expenses`.
function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: expenseKeys.all });
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (input: ExpenseInput) => api.post<Expense>('/expenses', input),
    onSettled: invalidate,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseUpdate }) =>
      api.patch<Expense>(`/expenses/${id}`, input),
    onSettled: invalidate,
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (expense: Expense) => api.delete(`/expenses/${expense.id}`),
    // Remove the row straight away; the refetch afterwards corrects totals.
    onMutate: async (expense) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', 'list'] });
      const previous = queryClient.getQueriesData<Paginated<Expense>>({ queryKey: ['expenses', 'list'] });
      queryClient.setQueriesData<Paginated<Expense>>({ queryKey: ['expenses', 'list'] }, (page) =>
        page && { ...page, data: page.data.filter((item) => item.id !== expense.id) },
      );
      return { previous };
    },
    onError: (_error, _expense, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}
