'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import RichBody from './RichBody';
import PostComposer from './PostComposer';
import { Post, Comment, fmtDate } from '@/lib/posts';

const BASE = '/post';

export default function PostDetailView({ id }: { id: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cInput, setCInput] = useState('');
  const [cName, setCName] = useState('');

  const loadPost = async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', id).single();
    setPost((data ?? null) as Post | null);
    setLoading(false);
  };
  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true });
    setComments((data ?? []) as Comment[]);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMe({ id: user.id, email: user.email ?? '' });
        const { data } = await supabase.rpc('is_admin'); setCanWrite(!!data);
      }
    })();
    loadPost(); loadComments();
    const ch = supabase.channel(`post-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPost())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => loadComments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const del = async () => {
    if (!post || !confirm(`'${post.title}' 글을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    router.push('/');
  };
  const toggle = async (field: 'comments_locked' | 'comments_hidden') => {
    if (!post) return;
    const { error } = await supabase.from('posts').update({ [field]: !post[field] }).eq('id', post.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    loadPost();
  };
  const addComment = async () => {
    if (!post) return;
    const body = cInput.trim(); if (!body) return;
    const name = me ? (me.email || '관리자') : cName.trim();
    if (!me && !name) { alert('이름을 입력하세요.'); return; }
    const { error } = await supabase.from('comments').insert({
      post_id: post.id, body, author_id: me?.id ?? null, author_name: name || '익명',
    });
    if (error) { alert('댓글 등록 실패: ' + error.message); return; }
    setCInput(''); loadComments();
  };
  const delComment = async (c: Comment) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', c.id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    loadComments();
  };

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;
  if (!post) return (
    <div className="card text-center text-gray-400 py-10">
      글을 찾을 수 없습니다. <Link href="/" className="text-brand-600 hover:underline ml-1">목록으로</Link>
    </div>
  );

  const showComments = !post.comments_hidden || canWrite;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← 목록으로</button>

      <article className="card">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-1.5">
              {post.pinned && <span className="badge text-xs">📌</span>}{post.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">{fmtDate(post.created_at)}</p>
          </div>
          {canWrite && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:underline">수정</button>
              <button onClick={del} className="text-xs text-red-500 hover:underline">삭제</button>
            </div>
          )}
        </div>

        {post.body && <div className="mt-4 text-gray-700"><RichBody body={post.body} /></div>}

        {(post.files ?? []).length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5 items-start">
            {(post.files ?? []).map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" download
                 className="inline-flex items-center gap-1.5 text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded px-3 py-1.5 hover:bg-brand-100">
                📎 {f.name}
              </a>
            ))}
          </div>
        )}

        {(post.tags ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(post.tags ?? []).map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}
                className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100">#{t}</Link>
            ))}
          </div>
        )}

        {canWrite && (
          <div className="mt-4 pt-2 border-t border-gray-100 flex gap-3 text-xs text-gray-500">
            <button onClick={() => toggle('comments_locked')} className="hover:underline">{post.comments_locked ? '🔓 댓글잠금 해제' : '🔒 댓글잠금'}</button>
            <button onClick={() => toggle('comments_hidden')} className="hover:underline">{post.comments_hidden ? '👁 댓글표시' : '🙈 댓글숨김'}</button>
          </div>
        )}
      </article>

      <div className="card">
        <div className="text-sm font-medium text-gray-600 mb-3">
          💬 댓글 {comments.length}{post.comments_hidden && canWrite && <span className="ml-1 text-red-500">(숨김 상태)</span>}
        </div>
        {showComments ? comments.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-2 text-sm py-2 border-b border-gray-50 last:border-0">
            <div className="min-w-0">
              <span className="font-medium text-gray-700">{c.author_name ?? '익명'}</span>
              <span className="text-gray-400 text-xs ml-1.5">{fmtDate(c.created_at)}</span>
              <div className="text-gray-700 whitespace-pre-wrap break-words">{c.body}</div>
            </div>
            {canWrite && <button onClick={() => delComment(c)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>}
          </div>
        )) : <p className="text-xs text-gray-400">댓글이 숨김 처리되었습니다.</p>}

        {post.comments_locked ? (
          <p className="text-xs text-gray-400 mt-3">🔒 댓글이 잠겨 있습니다.</p>
        ) : (
          <div className="mt-3 flex flex-col sm:flex-row gap-1.5">
            {!me && <input className="input text-sm py-1 sm:w-28" placeholder="이름" value={cName} onChange={(e) => setCName(e.target.value)} />}
            <input className="input text-sm py-1 flex-1" placeholder="댓글 달기..." value={cInput}
              onChange={(e) => setCInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }} />
            <button onClick={addComment} className="btn-secondary text-xs">등록</button>
          </div>
        )}
      </div>

      {editing && <PostComposer editing={post} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); loadPost(); }} />}
    </div>
  );
}
