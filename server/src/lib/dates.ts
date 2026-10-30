// Expense dates are calendar dates (Postgres DATE), so they are always
// handled as UTC midnight to avoid timezone shifts.

export const toDbDate = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

export const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);
