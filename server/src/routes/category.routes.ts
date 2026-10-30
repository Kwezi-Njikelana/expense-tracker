import { Router } from 'express';
import * as categories from '../controllers/category.controller';
import { requireAuth } from '../middleware/require-auth';

export const categoryRouter = Router().use(requireAuth).get('/', categories.list);
