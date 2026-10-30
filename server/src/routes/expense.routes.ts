import { Router } from 'express';
import * as expenses from '../controllers/expense.controller';
import { requireAuth } from '../middleware/require-auth';

export const expenseRouter = Router()
  .use(requireAuth)
  .get('/', expenses.list)
  .get('/summary', expenses.summary)
  .post('/', expenses.create)
  .patch('/:id', expenses.update)
  .delete('/:id', expenses.remove);
