import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendStatusUpdateNotification } from '../bot/telegramBot';

export const adminRouter = Router();
adminRouter.use(authMiddleware);

// GET all bookings with filters
adminRouter.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { status, date, phone, name, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq('booking_status', status);
    if (date) query = query.eq('game_date', date);
    if (phone) query = query.ilike('customer_phone', `%${phone}%`);
    if (name) query = query.ilike('customer_name', `%${name}%`);
    if (search) query = query.eq('booking_number', search);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ bookings: data, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения броней' });
  }
});

// GET single booking
adminRouter.get('/bookings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!booking) return res.status(404).json({ error: 'Бронь не найдена' });

    const { data: logs } = await supabase
      .from('booking_logs')
      .select('*')
      .eq('booking_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({ ...booking, logs });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH update booking status
adminRouter.patch('/bookings/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, admin_comment } = z.object({
      status: z.enum(['new','awaiting_prepayment','prepayment_review','confirmed','cancelled','completed','no_show']),
      admin_comment: z.string().optional(),
    }).parse(req.body);

    const { data: existing } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Бронь не найдена' });

    const updates: Record<string, unknown> = {
      booking_status: status,
      processed_by: req.admin?.id,
    };
    if (admin_comment) updates.admin_comment = admin_comment;
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (status === 'completed' || status === 'no_show') {
      updates.completed_at = new Date().toISOString();
      // Copy to games_history
      await supabase.from('games_history').insert({
        booking_id: existing.id,
        booking_number: existing.booking_number,
        customer_name: existing.customer_name,
        customer_phone: existing.customer_phone,
        game_date: existing.game_date,
        game_time: existing.game_time,
        players_count: existing.players_count,
        balls_count: existing.balls_count,
        total_price: existing.total_price,
        prepayment_amount: existing.prepayment_amount,
        prepayment_status: existing.prepayment_status,
        final_status: status,
        admin_comment: admin_comment || existing.admin_comment,
        finished_at: new Date().toISOString(),
      });
    }

    const { data: updated } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    await supabase.from('booking_logs').insert({
      booking_id: req.params.id,
      event_type: 'status_changed',
      old_value: existing.booking_status,
      new_value: status,
      description: admin_comment || `Статус изменён на "${status}"`,
      performed_by: req.admin?.login,
    });

    sendStatusUpdateNotification(updated, status).catch(console.error);

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// PATCH update prepayment status
adminRouter.patch('/bookings/:id/prepayment', async (req: AuthRequest, res: Response) => {
  try {
    const { prepayment_status } = z.object({
      prepayment_status: z.enum(['not_paid','pending','confirmed','returned','held','cancelled']),
    }).parse(req.body);

    const updates: Record<string, unknown> = { prepayment_status };
    if (prepayment_status === 'confirmed') updates.prepayment_confirmed_at = new Date().toISOString();
    if (prepayment_status === 'returned') updates.prepayment_returned_at = new Date().toISOString();

    const { data: updated } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    await supabase.from('booking_logs').insert({
      booking_id: req.params.id,
      event_type: 'prepayment_updated',
      new_value: prepayment_status,
      performed_by: req.admin?.login,
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Ошибка обновления предоплаты' });
  }
});

// PATCH update booking details
adminRouter.patch('/bookings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const allowed = z.object({
      game_date: z.string().optional(),
      game_time: z.string().optional(),
      admin_comment: z.string().optional(),
    }).parse(req.body);

    const { data: updated } = await supabase
      .from('bookings')
      .update(allowed)
      .eq('id', req.params.id)
      .select()
      .single();

    await supabase.from('booking_logs').insert({
      booking_id: req.params.id,
      event_type: 'booking_updated',
      description: 'Детали брони изменены администратором',
      performed_by: req.admin?.login,
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// GET games history
adminRouter.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', date, phone } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('games_history')
      .select('*', { count: 'exact' })
      .order('game_date', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (date) query = query.eq('game_date', date);
    if (phone) query = query.ilike('customer_phone', `%${phone}%`);

    const { data, count } = await query;
    res.json({ history: data, total: count });
  } catch {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// GET dashboard stats
adminRouter.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total, todayBookings, confirmed, completed] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('game_date', today),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
      supabase.from('games_history').select('id', { count: 'exact', head: true }),
    ]);

    const { data: revenueData } = await supabase
      .from('games_history')
      .select('total_price')
      .eq('final_status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.total_price), 0) || 0;

    res.json({
      total_bookings: total.count || 0,
      today_bookings: todayBookings.count || 0,
      confirmed_bookings: confirmed.count || 0,
      total_games: completed.count || 0,
      total_revenue: totalRevenue,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка статистики' });
  }
});
