import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taj Paintball — Пейнтбольный клуб в Таджикистане',
  description: 'Лучший пейнтбольный клуб в Таджикистане. Онлайн-бронирование игр. Душанбе.',
  keywords: 'пейнтбол, Таджикистан, Душанбе, бронирование, игры',
  openGraph: {
    title: 'Taj Paintball',
    description: 'Пейнтбольный клуб в Душанбе',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
