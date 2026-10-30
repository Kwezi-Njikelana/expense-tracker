import type { Expense } from '@expense-tracker/shared';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCreateExpense, useDeleteExpense } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/format';

interface DeleteExpenseDialogProps {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExpenseDialog({ expense, onOpenChange }: DeleteExpenseDialogProps) {
  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();

  const handleDelete = (target: Expense) => {
    deleteExpense.mutate(target, {
      onSuccess: () =>
        toast.success('Expense deleted', {
          description: target.description,
          action: {
            label: 'Undo',
            onClick: () =>
              createExpense.mutate(
                {
                  description: target.description,
                  amountCents: target.amountCents,
                  categoryId: target.category.id,
                  date: target.date,
                },
                { onError: () => toast.error('Could not restore expense') },
              ),
          },
        }),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <AlertDialog open={expense !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
          <AlertDialogDescription>
            {expense && (
              <>
                “{expense.description}” for {formatCurrency(expense.amountCents)} will be removed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => expense && handleDelete(expense)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
