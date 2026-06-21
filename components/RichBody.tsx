'use client';

import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

// 마크다운 렌더 + 이미지/유튜브는 결과물만(주소 숨김) 임베드
export default function RichBody({ body }: { body: string }) {
  if (!body) return null;

  // 유튜브 → ID 수집 후 텍스트에서 제거(주소 숨김)
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})[^\s)]*/g;
  const ytIds: string[] = [];
  let text = body.replace(ytRegex, (_full, id: string) => { if (!ytIds.includes(id)) ytIds.push(id); return ''; });

  // 맨 URL 이미지는 마크다운 이미지로 변환(주소 대신 이미지만)
  text = text.replace(/(!\[[^\]]*\]\([^)]+\))|((?:https?:\/\/)[^\s)]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s)]*)?)/gi,
    (full, mdImg, bareImg) => (mdImg ? mdImg : `\n\n![](${bareImg})\n\n`));

  const html = marked.parse(text) as string;

  return (
    <>
      <div
        className="text-sm break-words leading-relaxed
          [&_a]:text-brand-600 [&_a]:underline
          [&_img]:mt-2 [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:max-w-full [&_img]:max-h-96 [&_img]:object-contain
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h3]:font-bold
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-bold [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {ytIds.map((id) => (
        <div key={id} className="mt-3 aspect-video w-full max-w-xl">
          <iframe className="w-full h-full rounded-lg border border-gray-200"
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      ))}
    </>
  );
}
