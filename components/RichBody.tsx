'use client';

import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

// 유튜브를 '작성한 위치 그대로' 인라인 임베드(주소 숨김)
const ytEmbed = (id: string) =>
  `\n\n<div style="position:relative;width:100%;max-width:36rem;aspect-ratio:16/9;margin-top:0.75rem">` +
  `<iframe style="position:absolute;inset:0;width:100%;height:100%;border:1px solid #e5e7eb;border-radius:0.5rem" ` +
  `src="https://www.youtube.com/embed/${id}" title="YouTube video" ` +
  `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n\n`;

// 마크다운 렌더 + 이미지/유튜브는 결과물만(주소 숨김), 작성한 위치 그대로 표시
export default function RichBody({ body }: { body: string }) {
  if (!body) return null;

  let text = body;

  // 1) 유튜브 URL → 그 자리에 임베드(주소 텍스트는 제거)
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})[^\s)]*/g;
  text = text.replace(ytRegex, (_full, id: string) => ytEmbed(id));

  // 2) 맨 URL 이미지 → 그 자리에 마크다운 이미지(주소 대신 이미지)
  text = text.replace(/(!\[[^\]]*\]\([^)]+\))|((?:https?:\/\/)[^\s)]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s)]*)?)/gi,
    (full, mdImg, bareImg) => (mdImg ? mdImg : `\n\n![](${bareImg})\n\n`));

  // 3) 연속된 빈 줄(엔터 여러 번)을 입력한 만큼 유지(마크다운이 합치지 않도록 <br> 보강)
  text = text.replace(/\n{2,}/g, (m) => '\n\n' + '<br>'.repeat(m.length - 2));

  // 4) 마크다운 → HTML (작성자는 관리자뿐이라 원문 HTML 허용)
  const html = marked.parse(text) as string;

  return (
    <div
      className="text-sm break-words leading-relaxed
        [&_a]:text-brand-600 [&_a]:underline
        [&_img]:mt-2 [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:max-w-full [&_img]:max-h-96 [&_img]:object-contain
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h3]:font-bold
        [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-bold [&_em]:italic"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
