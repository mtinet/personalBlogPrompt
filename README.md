# personalBlogPrompt — 개인 블로그 스타터

Next.js 14/15(App Router, Edge) + Supabase + Cloudflare Pages 기반의 **1인 운영 개인 블로그** 스타터.
SSRC 시스템의 블로그 기능을 그대로 떼어 만든 것이라, clone 후 키만 넣으면 바로 굴러간다.

## 기능
- 공개 블로그 목록(페이지당 5개 **페이지네이션**) + **본문 앞 ~10% 미리보기**(글/이미지/유튜브)
- **카드 어디나 클릭**해서 상세로, "목록으로" 시 **보던 페이지 복원**
- **검색**(제목·내용·태그) + **태그 패널** 필터
- 상세: 마크다운 렌더, **이미지/유튜브는 주소 숨기고 결과만**, 첨부 다운로드
- **댓글**: 누구나 작성 / 관리자는 삭제·글별 **잠금·숨김**·전체 **일괄** 조정
- 관리자 글쓰기: **마크다운 에디터(서식 툴바)**, **해시태그**, **다중 파일 드래그앤드롭**, 상단 고정
- 작성/수정/삭제는 **관리자(나)만**, RLS로 DB 단에서도 강제

## 빠른 시작

### 1) Supabase
1. <https://supabase.com> 에서 프로젝트 생성
2. **SQL Editor**에 `database/schema.sql` 붙여넣기 — 단, 맨 위 `owner@example.com`을 **본인 이메일**로 바꾼 뒤 실행
3. **Authentication > Users > Add user**로 본인 이메일/비밀번호 계정 생성(이메일은 위와 동일하게)
4. **Settings > API**에서 `Project URL`, `anon public` 키 복사

### 2) 환경변수
`.env.example`을 `.env.local`로 복사 후 값 채우기:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BLOG_TITLE=나의 블로그
```

### 3) 로컬 실행
```
npm install
npm run dev      # http://localhost:3000
```

### 4) 배포 (Cloudflare Pages)
1. 이 저장소를 GitHub에 push
2. Cloudflare 대시보드 > **Workers & Pages > Create > Pages > Connect to Git**으로 저장소 연결
3. 빌드 설정:
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
   - **Environment variables**: 위 3개 (`NEXT_PUBLIC_*`)
   - **Settings > Functions > Compatibility flags**(Production·Preview 모두): `nodejs_compat`
4. 저장하면 push할 때마다 자동 배포

## 구조
```
app/            page.tsx(목록) · post/[id](상세) · login · layout
components/      Header · PostListView · PostDetailView · PostComposer · RichBody · RichEditor
lib/            supabase-client.ts · posts.ts(타입·헬퍼)
database/        schema.sql
```

## 메모(스택 함정)
- 모든 page에 `export const runtime = 'edge'` (Cloudflare Pages 필수)
- 스토리지 객체 키는 **ASCII만**(한글 파일명은 키에서 제외, 원본명은 DB에 저장)
- 다중 파일 선택 시 `FileList`를 즉시 `Array.from`으로 스냅샷
- 마크다운은 `marked` 사용, 작성자는 관리자뿐이라 원문 HTML(색·크기) 허용
