import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
test("blog migration upgrades the previous release without changing existing content, identities or logo settings", async () => {
  const admin = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  const name = `blog_upgrade_${Date.now().toString(36)}`, temp = await mkdtemp(path.join(tmpdir(), "blog-upgrade-"));
  await admin.unsafe(`create database ${name}`); const url = new URL(process.env.DATABASE_URL); url.pathname = `/${name}`;
  const db = postgres(url.toString(), { max: 1, onnotice: () => {} });
  try {
    const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")); journal.entries = journal.entries.filter((e) => e.idx < 6);
    await mkdir(path.join(temp, "meta")); await writeFile(path.join(temp, "meta/_journal.json"), JSON.stringify(journal));
    for (const e of journal.entries) await copyFile(`drizzle/${e.tag}.sql`, path.join(temp, `${e.tag}.sql`));
    await migrate(drizzle(db), { migrationsFolder: temp });
    execFileSync("node", ["scripts/seed.mjs"], { env: { ...process.env, DATABASE_URL: url.toString(), ADMIN_EMAIL: "", ADMIN_PASSWORD: "" }, stdio: "pipe" });
    await db`update services set title='Owner edited service',updated_at=now() where slug='seo-audit'`;
    await db`insert into settings(key,value) values ('general','{"headerLogo":"/uploads/owner.png","footerLogo":"/uploads/footer.png"}') on conflict(key) do update set value=excluded.value`;
    await db`insert into plugins(slug,name) values ('owner-plugin','Owner plugin')`;
    await db`insert into download_users(phone) values ('fixture-upgrade-identity')`;
    const before = await db`select (select jsonb_agg(to_jsonb(s)) from services s) services,(select jsonb_agg(to_jsonb(p)) from plugins p) plugins,(select jsonb_agg(to_jsonb(u)) from download_users u) users,(select value from settings where key='general') general`;
    await migrate(drizzle(db), { migrationsFolder: "drizzle" }); await migrate(drizzle(db), { migrationsFolder: "drizzle" });
    const after = await db`select (select jsonb_agg(to_jsonb(s)) from services s) services,(select jsonb_agg(to_jsonb(p)) from plugins p) plugins,(select jsonb_agg(to_jsonb(u)) from download_users u) users,(select value from settings where key='general') general`;
    assert.deepEqual(after, before);
    assert.equal((await db`select count(*)::int n from blog_articles`)[0].n, 0); assert.equal((await db`select count(*)::int n from blog_categories`)[0].n, 0);
  } finally { await db.end(); await admin.unsafe(`drop database ${name} with (force)`); await admin.end(); await rm(temp, { recursive: true, force: true }); }
});
