import type { Category } from '@expense-tracker/shared';
import { prisma } from '../db/prisma';

export const categorySelect = { id: true, name: true, color: true, icon: true } as const;

export function listCategories(userId: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId },
    select: categorySelect,
    orderBy: { name: 'asc' },
  });
}
