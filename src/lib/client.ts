export async function api<T = any>(action: string, body?: unknown): Promise<T> {
  const res = await fetch("/api/" + action, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "請求失敗");
  return data;
}
