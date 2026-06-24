import { getDb } from "@/lib/db/client";
import { rowToPerson } from "@/lib/db/mappers";
import type { PeopleRow } from "@/lib/db/row-types";
import { createId } from "@/lib/id";
import type { Person } from "@/types";

export const personRepository = {
  async findOrCreateByName(name: string): Promise<Person> {
    const trimmed = name.trim();
    const db = await getDb();

    const existing = await db.getFirstAsync<PeopleRow>("SELECT * FROM people WHERE name = ?", [
      trimmed,
    ]);

    if (existing) {
      return rowToPerson(existing);
    }

    const now = new Date().toISOString();
    const id = createId();

    await db.runAsync(
      `INSERT INTO people (id, name, phone_number, notes, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, ?, ?)`,
      [id, trimmed, now, now],
    );

    return rowToPerson({
      id,
      name: trimmed,
      phone_number: null,
      notes: null,
      created_at: now,
      updated_at: now,
    });
  },
};
