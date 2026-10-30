import { z } from 'zod';

// Request schemas are shared so the client and the API validate input with
// exactly the same rules.

/** Largest single expense we accept: R10 000 000.00, stored in cents. */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

const isoDate = z.iso.date({ error: 'Use a valid date (YYYY-MM-DD)' });

// ---------- Auth ----------

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: 'Enter a valid email address' }));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Expenses ----------

export const expenseInputSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(200),
  amountCents: z
    .number({ error: 'Amount is required' })
    .int('Amount must be in whole cents')
    .positive('Amount must be greater than zero')
    .max(MAX_AMOUNT_CENTS, 'Amount is too large'),
  categoryId: z.uuid({ error: 'Choose a category' }),
  date: isoDate,
});

export const expenseUpdateSchema = expenseInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    error: 'Provide at least one field to update',
  });

export const expenseFiltersSchema = z.object({
  categoryId: z.uuid().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(100).optional(),
});

export const expenseListQuerySchema = expenseFiltersSchema.extend({
  sort: z.enum(['date', 'amount', 'description']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id: z.uuid({ error: 'Invalid id' }) });

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
/** Client-side list query: every field is optional and falls back to the API default. */
export type ExpenseListQuery = Partial<z.output<typeof expenseListQuerySchema>>;

// ---------- Categories ----------

/** Categories every new account starts with. `icon` is a lucide icon name. */
export const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#f97316', icon: 'utensils' },
  { name: 'Transportation', color: '#3b82f6', icon: 'car' },
  { name: 'Entertainment', color: '#a855f7', icon: 'clapperboard' },
  { name: 'Utilities', color: '#eab308', icon: 'zap' },
  { name: 'Healthcare', color: '#ef4444', icon: 'heart-pulse' },
  { name: 'Shopping', color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Other', color: '#64748b', icon: 'package' },
] as const;

// ---------- Response types ----------

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  description: string;
  amountCents: number;
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  totalCents: number;
  count: number;
}

export interface MonthlyTotal {
  /** YYYY-MM */
  month: string;
  totalCents: number;
}

export interface ExpenseSummary {
  totalCents: number;
  count: number;
  averageCents: number;
  byCategory: CategoryTotal[];
  monthly: MonthlyTotal[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
