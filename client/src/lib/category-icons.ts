import {
  Car,
  Clapperboard,
  HeartPulse,
  type LucideIcon,
  Package,
  ShoppingBag,
  Tag,
  Utensils,
  Zap,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  clapperboard: Clapperboard,
  zap: Zap,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  package: Package,
};

export const getCategoryIcon = (name: string) => icons[name] ?? Tag;
