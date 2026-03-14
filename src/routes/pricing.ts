import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';

export const pricingRouter = Router();

// Public: get active pricing
pricingRouter.get('/', async (_req: Request, res: Response) => {
  const { data } = await supabase
    .from('pricing')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  res.json(data || []);
});

// Admin: get all pricing
pricingRouter.get('/all', authMiddleware, async (_req: Request, res: Response) => {
  const { data } = await supabase.from('pricing').select('*').order('sort_order');
  res.json(data || []);
});

// Admin: create
pricingRouter.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      balls_count: z.number().int().min(100),
      price: z.number().positive(),
      is_active: z.boolean().default(true),
      sort_order: z.number().default(0),
    });
    const data = schema.parse(req.body);
    const { data: result } = await supabase.from('pricing').insert(data).select().single();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка создания тарифа' });
  }
});

// Admin: update
pricingRouter.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { data } = await supabase.from('pricing').update(req.body).eq('id', req.params.id).select().single();
  res.json(data);
});

// Admin: delete
pricingRouter.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  await supabase.from('pricing').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Admin: get/update settings
pricingRouter.get('/settings', authMiddleware, async (_req, res) => {
  const { data } = await supabase.from('settings').select('*');
  res.json(data || []);
});

pricingRouter.patch('/settings/:key', authMiddleware, async (req: Request, res: Response) => {
  const { value } = req.body;
  const { data } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', req.params.key)
    .select().single();
  res.json(data);
});
