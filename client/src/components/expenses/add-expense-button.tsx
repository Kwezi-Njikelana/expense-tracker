import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExpenseFormDialog } from './expense-form-dialog';

export function AddExpenseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add expense
      </Button>
      <ExpenseFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
