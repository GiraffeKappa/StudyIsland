import { createClient } from "@supabase/supabase-js";
import { ISLANDS, UNITS, LINKS, publisher } from "../src/island/data";
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Error("請先載入伺服器環境變數");
  const db = createClient(url, key, { auth: { persistSession: false } });
  for (const [table, rows] of [
    [
      "subjects",
      ISLANDS.map((i) => ({
        id: i.id,
        name: i.name.replace("島", ""),
        publisher: publisher(i.id),
        priority: ["math", "phy", "bio"].includes(i.id) ? 1 : 2,
      })),
    ],
    [
      "units",
      UNITS.map((u, i) => ({
        id: u.id,
        subject_id: u.island,
        name: u.name,
        concept_book: u.book,
        sort_order: i,
      })),
    ],
    ["unit_links", LINKS.map((l) => ({ a: l.a, b: l.b, reason: l.why }))],
  ] as [string, Record<string, unknown>[]][]) {
    const { error } = await db.from(table).upsert(rows);
    if (error) throw error;
  }
  const { count } = await db
    .from("textbook_mappings")
    .select("*", { head: true, count: "exact" });
  if (!count) {
    const { error } = await db.from("textbook_mappings").insert(
      UNITS.map((u) => ({
        unit_id: u.id,
        publisher: publisher(u.island),
        verified: false,
      })),
    );
    if (error) throw error;
  }
  console.log(
    `已匯入 ${ISLANDS.length} 科、${UNITS.length} 個原概念單元；正式章節待核對。`,
  );
}
void main().catch(() => {
  console.error("教材匯入失敗：請核對環境變數與 migrations，再重新執行。");
  process.exitCode = 1;
});
