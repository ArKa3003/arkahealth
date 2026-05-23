import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/** INS / lake tables introduced in migrations 020–035 (go-live scope). */
const NEW_TABLE_MIGRATIONS = [
  "020_ins_record_cache.sql",
  "021_ins_reference_cache.sql",
  "022_ins_rarity_index.sql",
  "023_ins_teaching_queue.sql",
  "024_ins_swallow_overrides.sql",
  "025_ins_mnai_events.sql",
  "026_ins_aiie_audit.sql",
  "030_ins_imaging_datalake.sql",
  "031_ins_scheduling_intent.sql",
  "032_ins_stat_events.sql",
  "034_federated_query_log.sql",
  "035_ins_counters.sql",
] as const;

function tablesCreatedInMigration(sql: string): string[] {
  const tables: string[] = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public|arka_lake)\.(\w+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    tables.push(m[1]);
  }
  return tables;
}

describe("Supabase RLS on new INS tables", () => {
  for (const file of NEW_TABLE_MIGRATIONS) {
    it(`${file} enables RLS and grants service_role policy`, () => {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8").toLowerCase();
      const tables = tablesCreatedInMigration(sql);

      if (tables.length === 0) {
        // 022: column additions + materialized view only (no new base table).
        expect(file).toBe("022_ins_rarity_index.sql");
        return;
      }

      for (const table of tables) {
        expect(
          sql,
          `${file}: table ${table} must enable row level security`,
        ).toMatch(new RegExp(`alter\\s+table\\s+(?:public|arka_lake)\\.${table}\\s+enable\\s+row\\s+level\\s+security`));
      }

      expect(sql).toMatch(/service_role|service role/);
      expect(sql).toMatch(/create\s+policy/);
    });
  }

  it("migration directory includes expected INS go-live files", () => {
    const onDisk = readdirSync(MIGRATIONS_DIR);
    for (const file of NEW_TABLE_MIGRATIONS) {
      expect(onDisk).toContain(file);
    }
  });
});
