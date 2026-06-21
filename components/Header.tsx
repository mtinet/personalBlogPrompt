'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { BLOG_TITLE } from '@/lib/posts';

export default function Header() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="font-bold text-brand-700 text-lg shrink-0">{BLOG_TITLE}</Link>
        {email ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{email}</span>
            <button onClick={signOut} className="text-gray-500 hover:text-gray-900">로그아웃</button>
          </div>
        ) : (
          <Link href="/login" className="btn-primary text-sm">로그인</Link>
        )}
      </div>
    </header>
  );
}
