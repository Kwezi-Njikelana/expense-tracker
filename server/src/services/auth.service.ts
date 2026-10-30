import bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES, type LoginInput, type RegisterInput, type User } from '@expense-tracker/shared';
import { prisma } from '../db/prisma';
import { Prisma } from '../generated/prisma/client';
import { ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';

const BCRYPT_ROUNDS = 12;

// Compared against when the email doesn't exist, so a failed login takes the
// same time either way and doesn't reveal which emails are registered.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash('not-a-real-password', BCRYPT_ROUNDS));

const toUser = ({ id, name, email }: User): User => ({ id, name, email });

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        categories: { create: DEFAULT_CATEGORIES.map((category) => ({ ...category })) },
      },
    });
    return toUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('An account with this email already exists');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !valid) {
    throw new UnauthorizedError('Invalid email or password');
  }
  return toUser(user);
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  return toUser(user);
}
