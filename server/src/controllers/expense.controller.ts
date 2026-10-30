import type { Request, Response } from 'express';
import {
  expenseFiltersSchema,
  expenseInputSchema,
  expenseListQuerySchema,
  expenseUpdateSchema,
  idParamSchema,
} from '@expense-tracker/shared';
import { getUserId } from '../middleware/require-auth';
import * as expenseService from '../services/expense.service';

export async function list(req: Request, res: Response) {
  const query = expenseListQuerySchema.parse(req.query);
  res.json(await expenseService.listExpenses(getUserId(req), query));
}

export async function summary(req: Request, res: Response) {
  const filters = expenseFiltersSchema.parse(req.query);
  res.json(await expenseService.getSummary(getUserId(req), filters));
}

export async function create(req: Request, res: Response) {
  const input = expenseInputSchema.parse(req.body);
  res.status(201).json(await expenseService.createExpense(getUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = expenseUpdateSchema.parse(req.body);
  res.json(await expenseService.updateExpense(getUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await expenseService.deleteExpense(getUserId(req), id);
  res.status(204).end();
}
