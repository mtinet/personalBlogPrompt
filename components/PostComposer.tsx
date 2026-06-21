'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import RichEditor from './RichEditor';
import { Post, FileItem, MAX_FILE_MB, parseTags } from '@/lib/posts';

export default function PostComposer({ editing, onClose, onSaved }: {
  editing: Post | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    body: editing?.body ?? '',
    pinned: editing?.pinned ?? false,
    tagsInput: (editing?.tags ?? []).map((t) => '#' + t).join(' '),
  });
  const [existingFiles, setExistingFiles] = useState<FileItem[]>(editing?.files ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setNewFiles((prev) => [...prev, ...arr]);
  };

  const save = async () => {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return; }
    const tooBig = newFiles.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) { alert(`'${tooBig.name}'이(가) ${MAX_FILE_MB}MB를 초과합니다.`); return; }
    setSaving(true);

    const uploaded: FileItem[] = [];
    for (const f of newFiles) {
      const ext = (f.name.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      const path = `blog_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext ? '.' + ext : ''}`;
      const { error: upErr } = await supabase.storage.from('blog').upload(path, f, { upsert: false });
      if (upErr) { setSaving(false); alert('파일 업로드 실패: ' + upErr.message); return; }
      uploaded.push({ url: supabase.storage.from('blog').getPublicUrl(path).data.publicUrl, name: f.name });
    }
    const files = [...existingFiles, ...uploaded];
    const tags = parseTags(form.tagsInput);

    if (editing) {
      const { error } = await supabase.from('posts').update({
        title: form.title.trim(), body: form.body, pinned: form.pinned, tags, files, updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) { setSaving(false); alert('저장 실패: ' + error.message); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('posts').insert({
        title: form.title.trim(), body: form.body, pinned: form.pinned, tags, files,
        author_id: user?.id, author_name: user?.email ?? '관리자',
      });
      if (error) { setSaving(false); alert('등록 실패: ' + error.message); return; }
    }
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b font-bold text-lg">{editing ? '글 수정' : '새 글 작성'}</div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <input className="input" placeholder="제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <RichEditor value={form.body} onChange={(v) => setForm({ ...form, body: v })} placeholder="내용" />
          <input className="input" placeholder="해시태그 (예: #일상 #개발 — 공백/쉼표 구분)" value={form.tagsInput} onChange={(e) => setForm({ ...form, tagsInput: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">첨부파일 (여러 개 가능, 각 {MAX_FILE_MB}MB 이하)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer text-sm text-center transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              <span className="text-gray-500">📁 파일을 끌어다 놓거나 <span className="text-brand-600 underline">클릭해서 추가</span> (여러 개 가능)</span>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            {(existingFiles.length > 0 || newFiles.length > 0) && (
              <ul className="mt-2 space-y-1">
                {existingFiles.map((f, i) => (
                  <li key={'e' + i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                    <span className="truncate">📎 {f.name}</span>
                    <button type="button" onClick={() => setExistingFiles((a) => a.filter((_, j) => j !== i))} className="text-red-500 ml-2">✕</button>
                  </li>
                ))}
                {newFiles.map((f, i) => (
                  <li key={'n' + i} className="flex items-center justify-between text-sm bg-brand-50 rounded px-2 py-1">
                    <span className="truncate">🆕 {f.name}</span>
                    <button type="button" onClick={() => setNewFiles((a) => a.filter((_, j) => j !== i))} className="text-red-500 ml-2">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
            <span>📌 상단 고정</span>
          </label>
        </div>
        <div className="px-5 py-3 border-t flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>취소</button>
          <button onClick={save} className="btn-primary flex-1" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}
