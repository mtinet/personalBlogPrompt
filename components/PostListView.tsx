'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import PostComposer from './PostComposer';
import RichBody from './RichBody';
import { Post, fmtDate, bodySnippet } from '@/lib/posts';

const PAGE_SIZE = 5;
const BASE = '/post';

export default function PostListView() {
  const supabase = createClient();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [composing, setComposing] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('posts').select('*')
      .order('pinned', { ascending: false }).order('created_at', { ascending: false });
    setPosts((data ?? []) as Post[]);
    const { data: cs } = await supabase.from('comments').select('post_id');
    const m: Record<number, number> = {};
    (cs ?? []).forEach((c: { post_id: number }) => { m[c.post_id] = (m[c.post_id] || 0) + 1; });
    setCounts(m);
    setLoading(false);
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('tag'); if (t) setActiveTag(t);
    const pg = parseInt(sp.get('page') || '1', 10); if (pg > 1) setPage(pg);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { const { data } = await supabase.rpc('is_admin'); setCanWrite(!!data); }
    })();
    load();
    const ch = supabase.channel('posts-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUrl = (pg: number, tag: string | null) => {
    const sp = new URLSearchParams();
    if (tag) sp.set('tag', tag);
    if (pg > 1) sp.set('page', String(pg));
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  };
  const goPage = (n: number) => { setPage(n); syncUrl(n, activeTag); window.scrollTo({ top: 0 }); };
  const selectTag = (t: string | null) => { setActiveTag(t); setPage(1); syncUrl(1, t); };
  const onSearch = (v: string) => { setSearch(v); setPage(1); syncUrl(1, activeTag); };
  const clearFilter = () => { setActiveTag(null); setSearch(''); setPage(1); syncUrl(1, null); };

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    posts.forEach((p) => (p.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeTag && !(p.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return (p.title + ' ' + p.body + ' ' + (p.tags ?? []).join(' ')).toLowerCase().includes(q);
    });
  }, [posts, search, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const delPost = async (p: Post) => {
    if (!confirm(`'${p.title}' 글을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    load();
  };

  const bulkSet = async (field: 'comments_locked' | 'comments_hidden', value: boolean) => {
    const labels: Record<string, string> = {
      'comments_locked-true': '모든 글의 댓글을 잠그시겠습니까? (새 댓글 차단)',
      'comments_locked-false': '모든 글의 댓글 잠금을 해제하시겠습니까?',
      'comments_hidden-true': '모든 글의 댓글을 숨기시겠습니까?',
      'comments_hidden-false': '모든 글의 댓글을 다시 표시하시겠습니까?',
    };
    if (!confirm(labels[`${field}-${value}`])) return;
    const { error } = await supabase.from('posts').update({ [field]: value }).gt('id', 0);
    setMenuOpen(false);
    if (error) { alert('변경 실패: ' + error.message); return; }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-700">글 목록</h2>
        {canWrite && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="btn-secondary text-sm">⚙️ 댓글 일괄 ▾</button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 text-sm">
                    <button onClick={() => bulkSet('comments_locked', true)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50">🔒 전체 댓글 잠금</button>
                    <button onClick={() => bulkSet('comments_locked', false)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50">🔓 전체 잠금 해제</button>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => bulkSet('comments_hidden', true)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50">🙈 전체 댓글 숨김</button>
                    <button onClick={() => bulkSet('comments_hidden', false)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50">👁 전체 댓글 표시</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setComposing(true)} className="btn-primary text-sm">✏️ 새 글</button>
          </div>
        )}
      </div>

      <input className="input max-w-md" placeholder="🔍 제목·내용·태그 검색" value={search} onChange={(e) => onSearch(e.target.value)} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full space-y-3">
          {(activeTag || search) && (
            <div className="text-sm text-gray-500">
              {activeTag && <span>태그 <b className="text-brand-700">#{activeTag}</b> · </span>}{filtered.length}건
              <button onClick={clearFilter} className="ml-2 text-brand-600 hover:underline">필터 해제</button>
            </div>
          )}

          {loading ? <div className="text-gray-400 text-sm">불러오는 중...</div>
          : filtered.length === 0 ? <div className="card text-center text-gray-400 py-10">{posts.length === 0 ? '아직 게시글이 없습니다.' : '검색 결과가 없습니다.'}</div>
          : pageItems.map((p) => {
            const snippet = bodySnippet(p.body);
            const href = `${BASE}/${p.id}`;
            return (
              <div key={p.id} onClick={() => router.push(href)}
                className={`card cursor-pointer hover:shadow-md transition-shadow ${p.pinned ? 'border-brand-300 bg-brand-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={href} onClick={(e) => e.stopPropagation()} className="font-semibold flex items-center gap-1.5 hover:text-brand-700">
                      {p.pinned && <span className="badge text-xs">📌</span>}
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(p.created_at)}
                      {(p.files ?? []).length > 0 && <span className="ml-1.5">📎 {(p.files ?? []).length}</span>}
                      {(counts[p.id] ?? 0) > 0 && <span className="ml-1.5">💬 {counts[p.id]}</span>}
                    </p>
                  </div>
                  {canWrite && (
                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEditingPost(p)} className="text-xs text-brand-600 hover:underline">수정</button>
                      <button onClick={() => delPost(p)} className="text-xs text-red-500 hover:underline">삭제</button>
                    </div>
                  )}
                </div>

                {snippet && (
                  <div className="relative mt-2 max-h-72 overflow-hidden text-gray-700">
                    <RichBody body={snippet} />
                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                )}

                {(p.tags ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {(p.tags ?? []).map((t) => (
                      <button key={t} onClick={() => selectTag(t)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${activeTag === t ? 'bg-brand-100 border-brand-300 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>#{t}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button onClick={() => goPage(curPage - 1)} disabled={curPage <= 1}
                className="px-2.5 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">이전</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => goPage(n)}
                  className={`px-3 py-1 text-sm rounded border ${n === curPage ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 hover:bg-gray-50'}`}>{n}</button>
              ))}
              <button onClick={() => goPage(curPage + 1)} disabled={curPage >= totalPages}
                className="px-2.5 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">다음</button>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-56 shrink-0">
          <div className="card">
            <div className="font-semibold text-sm mb-2">🏷 태그</div>
            {allTags.length === 0 ? <p className="text-xs text-gray-400">태그가 없습니다.</p> : (
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => selectTag(null)} className={`text-xs px-2 py-0.5 rounded-full border ${!activeTag ? 'bg-brand-100 border-brand-300 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>전체</button>
                {allTags.map(([t, n]) => (
                  <button key={t} onClick={() => selectTag(activeTag === t ? null : t)}
                    className={`text-xs px-2 py-0.5 rounded-full border ${activeTag === t ? 'bg-brand-100 border-brand-300 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>#{t} <span className="text-gray-400">{n}</span></button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {composing && <PostComposer editing={null} onClose={() => setComposing(false)} onSaved={() => { setComposing(false); load(); }} />}
      {editingPost && <PostComposer editing={editingPost} onClose={() => setEditingPost(null)} onSaved={() => { setEditingPost(null); load(); }} />}
    </div>
  );
}
