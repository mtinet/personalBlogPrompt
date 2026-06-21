'use client';

import { useParams } from 'next/navigation';
import PostDetailView from '@/components/PostDetailView';

export const runtime = 'edge';

export default function PostPage() {
  const params = useParams();
  return <PostDetailView id={Number(params.id)} />;
}
