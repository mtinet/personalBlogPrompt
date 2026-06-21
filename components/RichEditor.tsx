'use client';

import { useRef } from 'react';

// 마크다운 + 간단 서식(굵게/제목/목록/링크/색/크기) 툴바가 달린 textarea
export default function RichEditor({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const surround = (before: string, after: string, fallback = '텍스트') => {
    const ta = ref.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = value.slice(s, e) || fallback;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + sel.length;
    });
  };

  const Btn = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button type="button" title={title} onClick={onClick}
      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 bg-white">
      {children}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        <Btn onClick={() => surround('## ', '', '제목')} title="제목"><span className="font-bold">제목</span></Btn>
        <Btn onClick={() => surround('**', '**', '굵게')} title="굵게"><b>B</b></Btn>
        <Btn onClick={() => surround('*', '*', '기울임')} title="기울임"><i>I</i></Btn>
        <Btn onClick={() => surround('\n- ', '', '항목')} title="목록">• 목록</Btn>
        <Btn onClick={() => surround('[', '](https://)', '링크텍스트')} title="링크">🔗 링크</Btn>
        <span className="w-px bg-gray-200 mx-0.5" />
        <Btn onClick={() => surround('<span style="color:#dc2626">', '</span>')} title="빨강"><span className="text-red-600 font-bold">A</span></Btn>
        <Btn onClick={() => surround('<span style="color:#2563eb">', '</span>')} title="파랑"><span className="text-blue-600 font-bold">A</span></Btn>
        <Btn onClick={() => surround('<span style="color:#16a34a">', '</span>')} title="초록"><span className="text-green-600 font-bold">A</span></Btn>
        <Btn onClick={() => surround('<span style="font-size:1.3em">', '</span>')} title="크게">A+</Btn>
        <Btn onClick={() => surround('<span style="font-size:0.85em">', '</span>')} title="작게">A-</Btn>
      </div>
      <textarea ref={ref} className="input min-h-40" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
      <p className="text-xs text-gray-500 mt-1">
        마크다운 지원 · 이미지/유튜브 주소를 붙여넣으면 결과만 표시됩니다.
      </p>
    </div>
  );
}
