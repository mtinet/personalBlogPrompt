import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;
  // 빌드(프리렌더) 시 env가 없어도 throw하지 않도록 폴백.
  // 배포 시 Cloudflare Pages 환경변수가 빌드에 주입되어 실제 값이 들어간다.
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  );
  return client;
}
