import { format, parseISO } from 'date-fns';

const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const compactCurrency = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrency = (cents: number) => currency.format(cents / 100);
export const formatCompactCurrency = (cents: number) => compactCurrency.format(cents / 100);

/** Expense dates are calendar dates: parse them as local dates, not UTC. */
export const formatDate = (isoDate: string) => format(parseISO(isoDate), 'd MMM yyyy');
export const formatMonth = (yearMonth: string, pattern = 'MMM') => format(parseISO(`${yearMonth}-01`), pattern);

export const toIsoDate = (date: Date) => format(date, 'yyyy-MM-dd');

/** "45.50" or "45,50" → 4550 */
export const parseAmountToCents = (value: string) => Math.round(Number(value.replace(',', '.')) * 100);
export const centsToAmountInput = (cents: number) => (cents / 100).toFixed(2);
