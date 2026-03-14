import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../lib/supabase';

let bot: TelegramBot | null = null;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

const STATUS_LABELS: Record<string, string> = {
  new: '🆕 Новая',
  awaiting_prepayment: '💰 Ожидает предоплату',
  prepayment_review: '🔍 Предоплата на проверке',
  confirmed: '✅ Подтверждена',
  cancelled: '❌ Отменена',
  completed: '🏁 Завершена',
  no_show: '🚫 Клиент не пришёл',
};

const PREPAYMENT_LABELS: Record<string, string> = {
  not_paid: '❌ Не внесена',
  pending: '⏳ Ожидается',
  confirmed: '✅ Подтверждена',
  returned: '↩️ Возвращена',
  held: '🔒 Удержана',
  cancelled: '🚫 Отменена',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU');
}

function buildBookingMessage(booking: Record<string, unknown>): string {
  return `
🎯 *Новая бронь — Taj Paintball*

📋 ID: #${booking.booking_number}
👤 Имя: ${booking.customer_name}
📞 Телефон: ${booking.customer_phone}
📅 Дата: ${formatDate(booking.game_date as string)}
🕐 Время: ${String(booking.game_time).substring(0, 5)}
👥 Игроков: ${booking.players_count}
🎯 Шаров: ${booking.balls_count}
💵 Сумма: ${booking.total_price} сомони
💰 Предоплата: ${booking.prepayment_amount} сомони
📊 Статус предоплаты: ${PREPAYMENT_LABELS[booking.prepayment_status as string] || booking.prepayment_status}
${booking.customer_comment ? `💬 Комментарий: ${booking.customer_comment}` : ''}
🕒 Создано: ${new Date(booking.created_at as string).toLocaleString('ru-RU')}
`.trim();
}

function getBookingKeyboard(bookingId: string) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: `confirm_${bookingId}` },
        { text: '❌ Отменить', callback_data: `cancel_${bookingId}` },
      ],
      [
        { text: '💰 Предоплата получена', callback_data: `prepay_confirm_${bookingId}` },
        { text: '↩️ Предоплата возвращена', callback_data: `prepay_return_${bookingId}` },
      ],
      [
        { text: '🏁 Завершить игру', callback_data: `complete_${bookingId}` },
        { text: '🚫 Не пришёл', callback_data: `noshow_${bookingId}` },
      ],
    ],
  };
}

export async function sendNewBookingNotification(booking: Record<string, unknown>) {
  if (!bot || !ADMIN_CHAT_ID) return;
  try {
    const message = buildBookingMessage(booking);
    const sent = await bot.sendMessage(ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: getBookingKeyboard(booking.id as string),
    });

    await supabase.from('telegram_logs').insert({
      booking_id: booking.id,
      event_type: 'new_booking',
      message_text: message,
      telegram_message_id: sent.message_id,
      delivery_status: 'sent',
    });
  } catch (err) {
    console.error('Telegram notification error:', err);
  }
}

export async function sendStatusUpdateNotification(booking: Record<string, unknown>, newStatus: string) {
  if (!bot || !ADMIN_CHAT_ID) return;
  try {
    const label = STATUS_LABELS[newStatus] || newStatus;
    const message = `🔄 *Обновление брони #${booking.booking_number}*\n\nСтатус: ${label}\nКлиент: ${booking.customer_name}\nДата игры: ${formatDate(booking.game_date as string)} в ${String(booking.game_time).substring(0, 5)}`;
    await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Telegram update error:', err);
  }
}

async function handleCallbackQuery(query: TelegramBot.CallbackQuery) {
  if (!bot || !query.data || !query.message) return;

  const [action, ...idParts] = query.data.split('_');
  const bookingId = idParts.join('_');

  const actionMap: Record<string, { status?: string; prepayment?: string; label: string }> = {
    confirm:         { status: 'confirmed', label: '✅ Бронь подтверждена' },
    cancel:          { status: 'cancelled', label: '❌ Бронь отменена' },
    complete:        { status: 'completed', label: '🏁 Игра завершена' },
    noshow:          { status: 'no_show', label: '🚫 Клиент не пришёл' },
    prepay_confirm:  { prepayment: 'confirmed', label: '💰 Предоплата отмечена как полученная' },
    prepay_return:   { prepayment: 'returned', label: '↩️ Предоплата отмечена как возвращённая' },
  };

  // Find action key
  const actionKey = query.data.startsWith('prepay_confirm_') ? 'prepay_confirm'
    : query.data.startsWith('prepay_return_') ? 'prepay_return'
    : action;
  
  const actualId = query.data.startsWith('prepay_') ? query.data.replace(/^prepay_(confirm|return)_/, '') : bookingId;

  const mapped = actionMap[actionKey];
  if (!mapped) return;

  try {
    if (mapped.status) {
      const updates: Record<string, unknown> = { booking_status: mapped.status };
      if (mapped.status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (['cancelled','completed','no_show'].includes(mapped.status)) {
        updates.cancelled_at = mapped.status === 'cancelled' ? new Date().toISOString() : null;
        updates.completed_at = ['completed','no_show'].includes(mapped.status) ? new Date().toISOString() : null;
      }
      
      const { data: booking } = await supabase.from('bookings').update(updates).eq('id', actualId).select().single();
      
      if (mapped.status === 'completed' || mapped.status === 'no_show') {
        await supabase.from('games_history').insert({
          booking_id: booking.id,
          booking_number: booking.booking_number,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          game_date: booking.game_date,
          game_time: booking.game_time,
          players_count: booking.players_count,
          balls_count: booking.balls_count,
          total_price: booking.total_price,
          prepayment_amount: booking.prepayment_amount,
          prepayment_status: booking.prepayment_status,
          final_status: mapped.status,
          finished_at: new Date().toISOString(),
        });
      }
    }

    if (mapped.prepayment) {
      const updates: Record<string, unknown> = { prepayment_status: mapped.prepayment };
      if (mapped.prepayment === 'confirmed') updates.prepayment_confirmed_at = new Date().toISOString();
      if (mapped.prepayment === 'returned') updates.prepayment_returned_at = new Date().toISOString();
      await supabase.from('bookings').update(updates).eq('id', actualId);
    }

    await bot.answerCallbackQuery(query.id, { text: mapped.label });
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    });
    await bot.sendMessage(query.message.chat.id, `${mapped.label} (ID: ${actualId.substring(0,8)}...)`);
  } catch (err) {
    console.error('Callback error:', err);
    await bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки' });
  }
}

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg) => {
      if (msg.text === '/start') {
        await bot!.sendMessage(msg.chat.id,
          `🎯 *Taj Paintball Admin Bot*\n\nID вашего чата: \`${msg.chat.id}\`\n\nБот активен и готов принимать уведомления.`,
          { parse_mode: 'Markdown' }
        );
      }
      if (msg.text === '/stats') {
        const [total, today, confirmed] = await Promise.all([
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('game_date', new Date().toISOString().split('T')[0]),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
        ]);
        await bot!.sendMessage(msg.chat.id,
          `📊 *Статистика Taj Paintball*\n\nВсего броней: ${total.count}\nСегодня: ${today.count}\nПодтверждено: ${confirmed.count}`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.on('callback_query', handleCallbackQuery);
    bot.on('polling_error', (err) => console.error('Telegram polling error:', err));

    console.log('🤖 Telegram Bot initialized');
  } catch (err) {
    console.error('Failed to init Telegram bot:', err);
  }
}
