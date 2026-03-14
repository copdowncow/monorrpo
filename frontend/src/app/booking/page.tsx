'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface TimeSlot { id: string; slot_time: string; is_available: boolean; }

const STATUS_STEPS = ['Выбор даты', 'Данные', 'Подтверждение'];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ booking_number: string; total_price: number; prepayment_amount: number } | null>(null);
  const [error, setError] = useState('');
  const [priceCalc, setPriceCalc] = useState<{ total_price: number; prepayment_amount: number } | null>(null);

  const [form, setForm] = useState({
    game_date: '',
    game_time: '',
    customer_name: '',
    customer_phone: '',
    players_count: 4,
    balls_count: 300,
    customer_comment: '',
    agree_terms: false,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (form.game_date) {
      api.getSlots(form.game_date).then(setSlots).catch(() => setSlots([]));
    }
  }, [form.game_date]);

  useEffect(() => {
    if (form.balls_count >= 100) {
      api.calculatePrice(form.balls_count)
        .then(setPriceCalc)
        .catch(() => setPriceCalc({ total_price: (form.balls_count / 100) * 70, prepayment_amount: 50 }));
    }
  }, [form.balls_count]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.agree_terms) { setError('Необходимо согласие с условиями бронирования'); return; }
    setLoading(true);
    try {
      const result = await api.createBooking(form);
      setSuccess(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6">🎯</div>
          <h1 className="text-3xl font-black text-white mb-3">Заявка принята!</h1>
          <p className="text-neutral-400 mb-8">Ожидайте подтверждения от нашего администратора</p>
          <div className="card p-6 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-400">Номер брони:</span>
              <span className="text-orange-400 font-bold text-lg">{success.booking_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Итоговая сумма:</span>
              <span className="text-white font-bold">{success.total_price} сомони</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Предоплата:</span>
              <span className="text-orange-400 font-bold">{success.prepayment_amount} сомони</span>
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 text-sm text-orange-300">
            📞 Наш администратор свяжется с вами для подтверждения внесения предоплаты {success.prepayment_amount} сомони
          </div>
          <Link href="/" className="btn-primary block text-center">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-neutral-500 hover:text-orange-400 text-sm transition-colors mb-4 inline-block">← На главную</Link>
          <h1 className="text-4xl font-black text-white mb-2">Забронировать <span className="gradient-text">игру</span></h1>
          <p className="text-neutral-400">Заполните форму и мы свяжемся с вами</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-10 gap-2">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${step === i + 1 ? 'text-white font-medium' : 'text-neutral-500'}`}>{s}</span>
              {i < STATUS_STEPS.length - 1 && <div className="w-8 h-0.5 bg-neutral-700 mx-1" />}
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">
          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Выберите дату и время</h2>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Дата игры *</label>
                <input type="date" min={minDate} max={maxDate} value={form.game_date}
                  onChange={e => { set('game_date', e.target.value); set('game_time', ''); }}
                  className="input-field" />
              </div>
              {form.game_date && (
                <div>
                  <label className="block text-sm text-neutral-400 mb-3">Время игры *</label>
                  {slots.length === 0 ? (
                    <p className="text-neutral-500 text-sm">Загрузка слотов...</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map(slot => (
                        <button key={slot.id}
                          disabled={!slot.is_available}
                          onClick={() => set('game_time', slot.slot_time.substring(0, 5))}
                          className={`py-3 rounded-xl text-sm font-medium transition-all ${
                            !slot.is_available ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed line-through'
                            : form.game_time === slot.slot_time.substring(0, 5)
                            ? 'bg-orange-500 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}>
                          {slot.slot_time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => {
                if (!form.game_date) { setError('Выберите дату'); return; }
                if (!form.game_time) { setError('Выберите время'); return; }
                setError(''); setStep(2);
              }} className="btn-primary w-full mt-4">Далее →</button>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* STEP 2: Player Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">Данные и параметры</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Ваше имя *</label>
                  <input type="text" placeholder="Али Рахимов" value={form.customer_name}
                    onChange={e => set('customer_name', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Номер телефона *</label>
                  <input type="tel" placeholder="+992 XX XXX XXXX" value={form.customer_phone}
                    onChange={e => set('customer_phone', e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Количество игроков *</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set('players_count', Math.max(1, form.players_count - 1))}
                      className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors">−</button>
                    <span className="text-2xl font-bold text-orange-500 w-12 text-center">{form.players_count}</span>
                    <button onClick={() => set('players_count', Math.min(50, form.players_count + 1))}
                      className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Количество шаров *</label>
                  <select value={form.balls_count} onChange={e => set('balls_count', parseInt(e.target.value))} className="input-field">
                    {[100, 200, 300, 500, 700, 1000].map(n => (
                      <option key={n} value={n}>{n} шаров — {(n / 100 * 70)} сом</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Комментарий (необязательно)</label>
                <textarea placeholder="День рождения, особые пожелания..." value={form.customer_comment}
                  onChange={e => set('customer_comment', e.target.value)}
                  className="input-field resize-none" rows={3} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Назад</button>
                <button onClick={() => {
                  if (!form.customer_name.trim()) { setError('Введите ваше имя'); return; }
                  if (!form.customer_phone.trim()) { setError('Введите номер телефона'); return; }
                  setError(''); setStep(3);
                }} className="btn-primary flex-1">Далее →</button>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">Подтверждение брони</h2>
              <div className="bg-neutral-800 rounded-xl p-5 space-y-3 text-sm">
                {[
                  ['📅 Дата', `${new Date(form.game_date).toLocaleDateString('ru-RU')} в ${form.game_time}`],
                  ['👤 Имя', form.customer_name],
                  ['📞 Телефон', form.customer_phone],
                  ['👥 Игроков', `${form.players_count} чел.`],
                  ['🎯 Шаров', `${form.balls_count} шт.`],
                  ...(form.customer_comment ? [['💬 Комментарий', form.customer_comment]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-neutral-400">{label}</span>
                    <span className="text-white text-right">{value}</span>
                  </div>
                ))}
                <div className="border-t border-neutral-700 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Итого:</span>
                    <span className="text-white font-bold text-lg">{priceCalc?.total_price ?? (form.balls_count / 100 * 70)} сомони</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-400">Предоплата сейчас:</span>
                    <span className="text-orange-400 font-bold text-lg">{priceCalc?.prepayment_amount ?? 50} сомони</span>
                  </div>
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-sm text-orange-300">
                💡 После отправки заявки наш администратор свяжется с вами для получения предоплаты <strong>{priceCalc?.prepayment_amount ?? 50} сомони</strong>. Предоплата возвращается после игры.
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agree_terms}
                  onChange={e => set('agree_terms', e.target.checked)}
                  className="mt-1 accent-orange-500" />
                <span className="text-sm text-neutral-300">
                  Я согласен(а) с условиями бронирования, правилами безопасности и обязуюсь внести предоплату для подтверждения брони
                </span>
              </label>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Назад</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? '⏳ Отправка...' : '✅ Отправить заявку'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
