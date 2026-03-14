import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const slotsRouter = Router();

// Public: get available time slots for a date
slotsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    const { data: allSlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!date) return res.json(allSlots || []);

    // Get booked slots for this date
    const { data: booked } = await supabase
      .from('bookings')
      .select('game_time')
      .eq('game_date', date)
      .not('booking_status', 'in', '("cancelled")');

    const bookedTimes = new Set(booked?.map(b => b.game_time.substring(0, 5)));

    const slotsWithAvailability = (allSlots || []).map(slot => ({
      ...slot,
      is_available: !bookedTimes.has(slot.slot_time.substring(0, 5)),
    }));

    res.json(slotsWithAvailability);
  } catch {
    res.status(500).json({ error: 'Ошибка' });
  }
});
