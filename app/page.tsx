'use client';

import PostListView from '@/components/PostListView';

export const runtime = 'edge';

export default function Home() {
  return <PostListView />;
}
