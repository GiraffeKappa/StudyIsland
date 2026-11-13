import { createClient } from "@supabase/supabase-js";
let supabase: ReturnType<typeof createClient> | null = null;
export function auth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (supabase ??= createClient(url, key));
}
export async function api<T = any>(action: string, body?: unknown): Promise<T> {
  const session = await auth()?.auth.getSession();
  const token = session?.data.session?.access_token;
  const res = await fetch("/api/" + action, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "請求失敗");
  return data;
}
