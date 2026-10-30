import type {
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpenseSummary,
  ExpenseUpdate,
  MonthlyTotal,
  Paginated,
} from '@expense-tracker/shared';
import { expenseListQuerySchema } from '@expense-tracker/shared';
import type { z } from 'zod';
import { prisma } from '../db/prisma';
import { Prisma } from '../generated/prisma/client';
import { fromDbDate, toDbDate } from '../lib/dates';
import { BadRequestError, NotFoundError } from '../lib/errors';
import { categorySelect } from './category.service';

type ListQuery = z.output<typeof expenseListQuerySchema>;

const include = { category: { select: categorySelect } } satisfies Prisma.ExpenseInclude;
type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof include }>;

const sortFields = {
  date: 'date',
  amount: 'amountCents',
  description: 'description',
} as const satisfies Record<ListQuery['sort'], keyof Prisma.ExpenseOrderByWithRelationInput>;

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amountCents,
    date: fromDbDate(row.date),
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(userId: string, filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  return {
    userId,
    categoryId: filters.categoryId,
    date:
      filters.from || filters.to
        ? {
            gte: filters.from ? toDbDate(filters.from) : undefined,
            lte: filters.to ? toDbDate(filters.to) : undefined,
          }
        : undefined,
    description: filters.q ? { contains: filters.q, mode: 'insensitive' } : undefined,
  };
}

async function assertCategoryOwned(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId }, select: { id: true } });
  if (!category) throw new BadRequestError('Unknown category');
}

export async function listExpenses(userId: string, query: ListQuery): Promise<Paginated<Expense>> {
  const where = buildWhere(userId, query);
  const [total, rows] = await prisma.$transaction([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include,
      orderBy: [{ [sortFields[query.sort]]: query.order }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: rows.map(toExpense),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function createExpense(userId: string, input: ExpenseInput) {
  await assertCategoryOwned(userId, input.categoryId);
  const row = await prisma.expense.create({
    data: { ...input, date: toDbDate(input.date), userId },
    include,
  });
  return toExpense(row);
}

export async function updateExpense(userId: string, id: string, input: ExpenseUpdate) {
  const existing = await prisma.expense.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new NotFoundError('Expense');
  if (input.categoryId) await assertCategoryOwned(userId, input.categoryId);

  const row = await prisma.expense.update({
    where: { id },
    data: { ...input, date: input.date ? toDbDate(input.date) : undefined },
    include,
  });
  return toExpense(row);
}

export async function deleteExpense(userId: string, id: string) {
  const { count } = await prisma.expense.deleteMany({ where: { id, userId } });
  if (count === 0) throw new NotFoundError('Expense');
}

export async function getSummary(userId: string, filters: ExpenseFilters): Promise<ExpenseSummary> {
  const where = buildWhere(userId, filters);

  const [totals, grouped, categories, monthlyRows] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amountCents: true }, _count: true }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.category.findMany({ where: { userId }, select: categorySelect }),
    queryMonthlyTotals(userId, filters),
  ]);

  const totalCents = totals._sum.amountCents ?? 0;
  const count = totals._count;
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  const byCategory = grouped
    .flatMap((group) => {
      const category = categoriesById.get(group.categoryId);
      if (!category) return [];
      return [
        {
          categoryId: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          totalCents: group._sum.amountCents ?? 0,
          count: group._count._all,
        },
      ];
    })
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    totalCents,
    count,
    averageCents: count > 0 ? Math.round(totalCents / count) : 0,
    byCategory,
    monthly: fillMonths(monthlyRows, filters),
  };
}

async function queryMonthlyTotals(userId: string, filters: ExpenseFilters) {
  const conditions = [Prisma.sql`user_id = ${userId}::uuid`];
  if (filters.categoryId) conditions.push(Prisma.sql`category_id = ${filters.categoryId}::uuid`);
  if (filters.from) conditions.push(Prisma.sql`date >= ${filters.from}::date`);
  if (filters.to) conditions.push(Prisma.sql`date <= ${filters.to}::date`);
  if (filters.q) conditions.push(Prisma.sql`description ILIKE ${`%${filters.q}%`}`);

  const rows = await prisma.$queryRaw<{ month: string; total: bigint }[]>`
    SELECT to_char(date, 'YYYY-MM') AS month, SUM(amount_cents)::bigint AS total
    FROM expenses
    WHERE ${Prisma.join(conditions, ' AND ')}
    GROUP BY 1
    ORDER BY 1`;

  return rows.map((row) => ({ month: row.month, totalCents: Number(row.total) }));
}

/** Adds zero-value months so charts show gaps instead of skipping them. */
function fillMonths(rows: MonthlyTotal[], filters: ExpenseFilters): MonthlyTotal[] {
  const start = filters.from?.slice(0, 7) ?? rows[0]?.month;
  const end = filters.to?.slice(0, 7) ?? rows.at(-1)?.month;
  if (!start || !end || start > end) return rows;

  const totals = new Map(rows.map((row) => [row.month, row.totalCents]));
  const months: MonthlyTotal[] = [];
  let [year, month] = start.split('-').map(Number) as [number, number];

  for (let key = start; key <= end; ) {
    months.push({ month: key, totalCents: totals.get(key) ?? 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    key = `${year}-${String(month).padStart(2, '0')}`;
  }
  return months;
}
