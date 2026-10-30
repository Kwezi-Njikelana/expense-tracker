import type { Request, Response } from 'express';
import { getUserId } from '../middleware/require-auth';
import * as categoryService from '../services/category.service';

export async function list(req: Request, res: Response) {
  res.json(await categoryService.listCategories(getUserId(req)));
}
