import type { Category } from '@expense-tracker/shared';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/category-icons';

export function CategoryIcon({ category, className }: { category: Pick<Category, 'color' | 'icon'>; className?: string }) {
  const Icon = getCategoryIcon(category.icon);
  return (
    <span
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg', className)}
      style={{ backgroundColor: `${category.color}1f`, color: category.color }}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ backgroundColor: category.color }} aria-hidden />
      {category.name}
    </span>
  );
}
