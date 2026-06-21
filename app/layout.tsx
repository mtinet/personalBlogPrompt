import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_BLOG_TITLE || '나의 블로그',
  description: '개인 블로그',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-8">© {new Date().getFullYear()}</footer>
      </body>
    </html>
  );
}
