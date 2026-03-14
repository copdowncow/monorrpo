'use client';
import Link from 'next/link';
import { useState } from 'react';

const REVIEWS = [
  { name: 'Алишер Р.', text: 'Отличное место! Отмечали день рождения — все в восторге. Персонал профессиональный, инвентарь в хорошем состоянии.', rating: 5 },
  { name: 'Диана М.', text: 'Были с командой с работы. Организовали корпоратив — незабываемо! Рекомендую всем.', rating: 5 },
  { name: 'Фарход Н.', text: 'Бронировали онлайн — очень удобно. Приехали, всё было готово. Обязательно вернёмся.', rating: 5 },
];

const ADVANTAGES = [
  { icon: '🎯', title: 'Профессиональное оборудование', desc: 'Качественные маркеры, защитные маски и снаряжение международного класса' },
  { icon: '🌿', title: 'Большая игровая зона', desc: 'Просторные поля с природным ландшафтом и профессиональными укрытиями' },
  { icon: '👨‍🏫', title: 'Опытные инструкторы', desc: 'Наши тренеры проведут инструктаж и помогут организовать игру' },
  { icon: '🎉', title: 'Мероприятия под ключ', desc: 'Дни рождения, корпоративы, турниры — организуем всё' },
  { icon: '🛡️', title: 'Безопасность прежде всего', desc: 'Строгие правила безопасности и качественная защитная экипировка' },
  { icon: '💰', title: 'Доступные цены', desc: 'Честная цена — 70 сомони за 100 шаров. Без скрытых платежей' },
];

const STEPS = [
  { step: '01', title: 'Бронируйте онлайн', desc: 'Выберите дату, время и количество игроков. Внесите предоплату 50 сомони.' },
  { step: '02', title: 'Приезжайте', desc: 'Приходите в назначенное время. Наша команда встретит вас.' },
  { step: '03', title: 'Получите снаряжение', desc: 'Вам выдадут маркер, маску, защитный жилет и шары.' },
  { step: '04', title: 'В бой!', desc: 'Инструктаж, команды, сигнал — и начинается незабываемая битва!' },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-orange-500">TAJ</span>
            <span className="text-2xl font-black text-white">PAINTBALL</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
            <a href="#prices" className="hover:text-orange-400 transition-colors">Цены</a>
            <a href="#how" className="hover:text-orange-400 transition-colors">Как это работает</a>
            <a href="#reviews" className="hover:text-orange-400 transition-colors">Отзывы</a>
            <a href="#contacts" className="hover:text-orange-400 transition-colors">Контакты</a>
            <Link href="/booking" className="btn-primary py-2 px-6 text-sm">Забронировать</Link>
          </div>
          <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-neutral-900 px-4 pb-4 flex flex-col gap-4">
            <a href="#prices" className="text-neutral-300 py-2" onClick={() => setMenuOpen(false)}>Цены</a>
            <a href="#how" className="text-neutral-300 py-2" onClick={() => setMenuOpen(false)}>Как это работает</a>
            <a href="#reviews" className="text-neutral-300 py-2" onClick={() => setMenuOpen(false)}>Отзывы</a>
            <a href="#contacts" className="text-neutral-300 py-2" onClick={() => setMenuOpen(false)}>Контакты</a>
            <Link href="/booking" className="btn-primary text-center">Забронировать</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-black to-red-900/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(239,68,68,0.15) 0%, transparent 50%)'
        }} />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <div className="inline-block bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 text-orange-400 text-sm font-medium mb-6">
            🎯 Лучший пейнтбол в Таджикистане
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-6 leading-none">
            <span className="gradient-text">TAJ</span>
            <br />
            <span className="text-white">PAINTBALL</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-300 mb-4 max-w-2xl mx-auto">
            Адреналин, командный дух и незабываемые эмоции
          </p>
          <p className="text-neutral-400 mb-10 max-w-xl mx-auto">
            Профессиональное снаряжение · Большие поля · Опытные инструкторы · Душанбе
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-primary text-lg py-4 px-10">
              🎯 Забронировать игру
            </Link>
            <a href="#how" className="btn-secondary text-lg py-4 px-10">
              Как это работает
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[['500+', 'Игр проведено'], ['98%', 'Довольных гостей'], ['5★', 'Средний рейтинг']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-3xl font-black text-orange-500">{n}</div>
                <div className="text-xs text-neutral-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-neutral-600 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* PRICES */}
      <section id="prices" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Цены и <span className="gradient-text">пакеты</span></h2>
            <p className="text-neutral-400 text-lg">Честная цена без скрытых платежей. 100 шаров = 70 сомони</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[
              { balls: 100, price: 70, label: 'Старт' },
              { balls: 200, price: 140, label: 'Базовый' },
              { balls: 300, price: 210, label: 'Стандарт' },
              { balls: 500, price: 350, label: 'Комфорт', popular: true },
              { balls: 700, price: 490, label: 'Про' },
              { balls: 1000, price: 700, label: 'Максимум' },
            ].map(pkg => (
              <div key={pkg.balls} className={`card p-4 text-center relative ${pkg.popular ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Популярный
                  </div>
                )}
                <div className="text-2xl font-black text-orange-500">{pkg.price}</div>
                <div className="text-xs text-neutral-400">сомони</div>
                <div className="text-sm font-semibold text-white mt-2">{pkg.balls} шаров</div>
                <div className="text-xs text-neutral-500 mt-1">{pkg.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 text-center">
            <p className="text-neutral-300 mb-2">
              <span className="text-orange-400 font-bold">Предоплата 50 сомони</span> — возвращается после игры
            </p>
            <p className="text-neutral-500 text-sm">Бронирование возможно онлайн 24/7 · Минимальный заказ — 100 шаров</p>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-24 px-4 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Почему <span className="gradient-text">Taj Paintball</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map(adv => (
              <div key={adv.title} className="card p-6 hover:border-orange-500/50 transition-colors">
                <div className="text-4xl mb-4">{adv.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{adv.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Как проходит <span className="gradient-text">игра</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%+0px)] w-full h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent z-0" />
                )}
                <div className="card p-6 relative z-10">
                  <div className="text-5xl font-black text-orange-500/20 mb-3">{step.step}</div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="py-16 px-4 bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title mb-8 text-center">Правила <span className="gradient-text">безопасности</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Обязательно надевать маску на игровом поле',
              'Не снимать маску до окончания игры',
              'Стрелять только в игровой зоне',
              'Слушать инструктора и следовать его командам',
              'Не целиться в незащищённые части тела',
              'Дети до 12 лет играют только со взрослыми',
              'Запрещено нахождение в нетрезвом виде',
              'При попадании поднять руку и покинуть поле',
            ].map(rule => (
              <div key={rule} className="flex items-start gap-3 card p-4">
                <div className="text-orange-500 text-lg mt-0.5">✓</div>
                <p className="text-neutral-300 text-sm">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Отзывы <span className="gradient-text">гостей</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(review => (
              <div key={review.name} className="card p-6">
                <div className="text-yellow-400 text-lg mb-3">{'★'.repeat(review.rating)}</div>
                <p className="text-neutral-300 text-sm leading-relaxed mb-4">{review.text}</p>
                <div className="text-orange-400 font-semibold text-sm">{review.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-3xl p-12">
            <h2 className="section-title mb-4">Готов к <span className="gradient-text">битве?</span></h2>
            <p className="text-neutral-400 mb-8 text-lg">Забронируй игру прямо сейчас — онлайн, быстро и удобно</p>
            <Link href="/booking" className="btn-primary text-xl py-5 px-12">
              🎯 Забронировать игру
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-16 px-4 bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title mb-8 text-center">Контакты</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-white font-bold mb-2">Адрес</h3>
              <p className="text-neutral-400 text-sm">Душанбе, Таджикистан</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="text-white font-bold mb-2">Телефон</h3>
              <a href="tel:+992000000000" className="text-orange-400 hover:text-orange-300 text-sm">+992 XX XXX XXXX</a>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="text-white font-bold mb-2">Режим работы</h3>
              <p className="text-neutral-400 text-sm">Ежедневно 10:00 – 21:00</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-2xl h-64 flex items-center justify-center">
            <p className="text-neutral-500">Карта будет добавлена после настройки адреса</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-orange-500">TAJ</span>
            <span className="text-xl font-black">PAINTBALL</span>
          </div>
          <p className="text-neutral-500 text-sm">© 2024 Taj Paintball. Все права защищены.</p>
          <Link href="/admin" className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors">
            Панель управления
          </Link>
        </div>
      </footer>
    </div>
  );
}
