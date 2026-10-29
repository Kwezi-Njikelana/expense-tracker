import { type Expense, MAX_AMOUNT_CENTS, expenseInputSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DatePicker } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-expenses';
import { ApiError } from '@/lib/api';
import { getCategoryIcon } from '@/lib/category-icons';
import { centsToAmountInput, parseAmountToCents, toIsoDate } from '@/lib/format';

// The API takes cents; people type rands. This schema handles the form side.
const formSchema = z.object({
  description: expenseInputSchema.shape.description,
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,8}([.,]\d{1,2})?$/, 'Enter an amount like 45.50')
    .refine((value) => parseAmountToCents(value) > 0, 'Amount must be greater than zero')
    .refine((value) => parseAmountToCents(value) <= MAX_AMOUNT_CENTS, 'Amount is too large'),
  categoryId: z.string().min(1, 'Choose a category'),
  date: z.date({ error: 'Pick a date' }),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const serverFieldMap: Record<string, keyof FormInput> = { amountCents: 'amount' };

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this expense instead of creating one. */
  expense?: Expense;
}

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const { data: categories = [] } = useCategories();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isEditing = Boolean(expense);

  const form = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(formSchema) });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      expense
        ? {
            description: expense.description,
            amount: centsToAmountInput(expense.amountCents),
            categoryId: expense.category.id,
            date: parseISO(expense.date),
          }
        : { description: '', amount: '', categoryId: '', date: new Date() },
    );
  }, [open, expense, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      description: values.description,
      amountCents: parseAmountToCents(values.amount),
      categoryId: values.categoryId,
      date: toIsoDate(values.date),
    };

    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, input });
        toast.success('Expense updated');
      } else {
        await createExpense.mutateAsync(input);
        toast.success('Expense added');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        for (const detail of error.details) {
          const field = serverFieldMap[detail.path] ?? (detail.path as keyof FormInput);
          form.setError(field, { message: detail.message });
        }
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not save expense');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this expense.' : 'Record something you spent money on.'}
          </DialogDescription>
        </DialogHeader>

        <form id="expense-form" onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Input
              id="description"
              placeholder="e.g. Groceries at Woolworths"
              autoComplete="off"
              aria-invalid={Boolean(errors.description)}
              {...form.register('description')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" htmlFor="amount" error={errors.amount?.message}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  R
                </span>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tabular pl-7"
                  aria-invalid={Boolean(errors.amount)}
                  {...form.register('amount')}
                />
              </div>
            </Field>

            <Field label="Date" htmlFor="date" error={errors.date?.message}>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <DatePicker id="date" value={field.value} onChange={field.onChange} invalid={Boolean(errors.date)} />
                )}
              />
            </Field>
          </div>

          <Field label="Category" htmlFor="category" error={errors.categoryId?.message}>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full" aria-invalid={Boolean(errors.categoryId)}>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const Icon = getCategoryIcon(category.icon);
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <Icon style={{ color: category.color }} />
                          {category.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
