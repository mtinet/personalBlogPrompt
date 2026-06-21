// 공통 타입·헬퍼

export interface FileItem { url: string; name: string; }

export interface Post {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  files: FileItem[] | null;
  tags: string[] | null;
  comments_locked: boolean;
  comments_hidden: boolean;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_name: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
}

export const MAX_FILE_MB = 20;
export const BLOG_TITLE = process.env.NEXT_PUBLIC_BLOG_TITLE || '나의 블로그';

export const isImageName = (name: string) => /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);

export const parseTags = (s: string) =>
  Array.from(new Set(s.split(/[,\s]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean)));

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

// 목록 미리보기: 본문 앞부분 ~10%(글·이미지·유튜브 포함)를 마크다운 그대로 반환
export function bodySnippet(body: string, ratio = 0.1, min = 160): string {
  const text = body || '';
  if (!text) return '';
  const budget = Math.max(min, Math.floor(text.length * ratio));
  if (text.length <= budget) return text;
  let cut = budget;
  const mediaRegex = /!\[[^\]]*\]\([^)]+\)|https?:\/\/\S+/g;
  let m: RegExpExecArray | null;
  while ((m = mediaRegex.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start >= cut) break;
    if (end > cut) cut = end;
  }
  const nl = text.indexOf('\n', cut);
  if (nl !== -1 && nl - cut < 80) cut = nl;
  return text.slice(0, cut).trim() + ' …';
}
