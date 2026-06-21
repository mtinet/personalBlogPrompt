'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export const runtime = 'edge';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError('로그인 실패: ' + error.message); return; }
    router.push('/'); router.refresh();
  };

  return (
    <div className="max-w-sm mx-auto card mt-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← 블로그로 돌아가기</Link>
      </div>
      <h1 className="text-xl font-bold mb-4 text-center">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
      </form>
    </div>
  );
}
