// Creates a demo account with six months of realistic expenses.
// Login: demo@example.com / password123
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEFAULT_CATEGORIES } from '@expense-tracker/shared';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_EMAIL = 'demo@example.com';

// [description, category, min rand, max rand, times per month]
const templates: [string, string, number, number, number][] = [
  ['Woolworths groceries', 'Food', 350, 1200, 4],
  ['Coffee', 'Food', 35, 65, 6],
  ['Uber Eats', 'Food', 120, 380, 2],
  ['Fuel', 'Transportation', 600, 1100, 2],
  ['Uber ride', 'Transportation', 60, 220, 3],
  ['Netflix', 'Entertainment', 199, 199, 1],
  ['Cinema tickets', 'Entertainment', 150, 320, 1],
  ['Electricity', 'Utilities', 800, 1400, 1],
  ['Fibre internet', 'Utilities', 699, 699, 1],
  ['Pharmacy', 'Healthcare', 90, 450, 1],
  ['Clothing', 'Shopping', 300, 1500, 1],
  ['Gift', 'Other', 150, 600, 0.5],
];

// Deterministic pseudo-random numbers so every seed produces the same data.
let state = 42;
const random = () => ((state = (state * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
const between = (min: number, max: number) => min + random() * (max - min);

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: await bcrypt.hash('password123', 12),
      categories: { create: DEFAULT_CATEGORIES.map((category) => ({ ...category })) },
    },
    include: { categories: true },
  });
  const categoryId = new Map(user.categories.map((category) => [category.name, category.id]));

  const today = new Date();
  const expenses = [];

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() - monthsAgo;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lastDay = monthsAgo === 0 ? today.getUTCDate() : daysInMonth;

    for (const [description, category, min, max, perMonth] of templates) {
      const times = Math.floor(perMonth) + (random() < perMonth % 1 ? 1 : 0);
      for (let i = 0; i < times; i++) {
        expenses.push({
          userId: user.id,
          categoryId: categoryId.get(category)!,
          description,
          amountCents: Math.round(between(min, max)) * 100 + (min === max ? 0 : Math.floor(random() * 100)),
          date: new Date(Date.UTC(year, month, 1 + Math.floor(random() * lastDay))),
        });
      }
    }
  }

  await prisma.expense.createMany({ data: expenses });
  console.log(`Seeded ${expenses.length} expenses for ${DEMO_EMAIL} (password: password123)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
