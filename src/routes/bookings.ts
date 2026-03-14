import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { sendNewBookingNotification } from '../bot/telegramBot';

export const bookingRouter = Router();

const bookingSchema = z.object({
  customer_name: z.string().min(2, 'Введите ваше имя').max(200),
  customer_phone: z.string().min(9, 'Введите корректный номер телефона').max(30),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты'),
  game_time: z.string().regex(/^\d{2}:\d{2}$/, 'Неверный формат времени'),
  players_count: z.number().int().min(1).max(100),
  balls_count: z.number().int().min(100).multipleOf(100, 'Количество шаров кратно 100'),
  customer_comment: z.string().max(1000).optional(),
  agree_terms: z.boolean().refine(v => v === true, 'Необходимо согласие с условиями'),
});

// GET public pricing for calculation
bookingRouter.get('/calculate', async (req: Request, res: Response) => {
  try {
    const balls = parseInt(req.query.balls as string);
    if (!balls || balls < 100) {
      return res.status(400).json({ error: 'Укажите количество шаров (минимум 100)' });
    }

    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['price_per_100_balls', 'prepayment_amount']);

    const price100 = parseFloat(settings?.find(s => s.key === 'price_per_100_balls')?.value || '70');
    const prepayment = parseFloat(settings?.find(s => s.key === 'prepayment_amount')?.value || '50');
    const total = (balls / 100) * price100;

    res.json({ total_price: total, prepayment_amount: prepayment, price_per_100: price100 });
  } catch {
    res.status(500).json({ error: 'Ошибка вычисления' });
  }
});

// POST create booking
bookingRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = bookingSchema.parse(req.body);

    // Validate date is not in the past
    const gameDate = new Date(data.game_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (gameDate < today) {
      return res.status(400).json({ error: 'Нельзя забронировать игру в прошлом' });
    }

    // Get pricing
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['price_per_100_balls', 'prepayment_amount']);

    const price100 = parseFloat(settings?.find(s => s.key === 'price_per_100_balls')?.value || '70');
    const prepayment = parseFloat(settings?.find(s => s.key === 'prepayment_amount')?.value || '50');
    const totalPrice = (data.balls_count / 100) * price100;

    // Generate booking number
    const { data: numData } = await supabase.rpc('generate_booking_number');
    const bookingNumber = numData || `TJP-${Date.now()}`;

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.trim(),
        game_date: data.game_date,
        game_time: data.game_time,
        players_count: data.players_count,
        balls_count: data.balls_count,
        price_per_100_balls: price100,
        total_price: totalPrice,
        prepayment_amount: prepayment,
        prepayment_status: 'pending',
        booking_status: 'awaiting_prepayment',
        customer_comment: data.customer_comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Booking insert error:', error);
      return res.status(500).json({ error: 'Ошибка создания брони' });
    }

    // Log
    await supabase.from('booking_logs').insert({
      booking_id: booking.id,
      event_type: 'booking_created',
      new_value: 'awaiting_prepayment',
      description: 'Новая заявка создана через сайт',
      performed_by: 'client',
    });

    // Telegram notification
    sendNewBookingNotification(booking).catch(console.error);

    res.status(201).json({
      success: true,
      booking_number: booking.booking_number,
      booking_id: booking.id,
      total_price: booking.total_price,
      prepayment_amount: booking.prepayment_amount,
      status: booking.booking_status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET booking status by number (public)
bookingRouter.get('/status/:number', async (req: Request, res: Response) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_number, customer_name, game_date, game_time, players_count, balls_count, total_price, prepayment_amount, prepayment_status, booking_status, created_at')
      .eq('booking_number', req.params.number)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Бронь не найдена' });
    }

    res.json(booking);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
