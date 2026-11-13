import { openDB } from "idb";
import { emptyState, type State } from "./domain";
const db = () =>
  openDB("study-island-v1", 1, {
    upgrade(db) {
      db.createObjectStore("students");
    },
  });
export async function readState(id: string): Promise<State> {
  return (await (await db()).get("students", id)) || emptyState();
}
export async function writeState(id: string, state: State) {
  await (await db()).put("students", state, id);
}
export async function clearState(id: string) {
  await (await db()).delete("students", id);
}
export async function clearIdentity(userId: string) {
  const database = await db();
  const tx = database.transaction("students", "readwrite");
  for (const key of await tx.store.getAllKeys()) {
    if (String(key).startsWith(userId + ":")) await tx.store.delete(key);
  }
  await tx.done;
}
