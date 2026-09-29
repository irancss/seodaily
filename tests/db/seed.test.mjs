// Migration and seed safety on throwaway databases (created and dropped here):
//   DATABASE_URL=postgres://user:pass@host:5432/any npm run test:db
// The role needs CREATEDB (the CI and local Postgres superuser has it).
// Never point this at Production.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { after, test } from "node:test";

import postgres from "postgres";
import { contentColumns, previousServiceContent, serviceContent } from "../../scripts/service-content/index.mjs";
import { pageCopy } from "../../scripts/editorial-copy.mjs";

const BASE = process.env.DATABASE_URL;
if (!BASE) throw new Error("Set DATABASE_URL (a disposable server; test databases are created next to it).");
const admin = postgres(BASE, { max: 1, onnotice: () => {} });
const created = [];

async function freshDb() {
  const name = `seed_test_${Date.now().toString(36)}_${created.length}`;
  await admin.unsafe(`create database ${name}`);
  created.push(name);
  const url = new URL(BASE);
  url.pathname = `/${name}`;
  return { url: url.toString(), sql: postgres(url.toString(), { max: 1, onnotice: () => {} }) };
}

/** Runs a script the way the container entrypoint does; returns { ok, out }. */
function run(script, url) {
  try {
    const out = execFileSync("node", [`scripts/${script}.mjs`], { env: { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: "", ADMIN_PASSWORD: "" }, encoding: "utf8", stdio: "pipe" });
    return { ok: true, out };
  } catch (error) {
    return { ok: false, out: `${error.stdout}${error.stderr}` };
  }
}

after(async () => {
  for (const name of created) {
    // FORCE may meet a backend it cannot end without superuser rights (an
    // autovacuum worker on the fresh database); those finish within moments.
    for (let attempt = 1; ; attempt++) {
      try {
        await admin.unsafe(`drop database if exists ${name} with (force)`);
        break;
      } catch (error) {
        if (error.code !== "42501" || attempt >= 10) throw error;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  await admin.end();
});

test("fresh install: migrate + seed give the full content, and a second start changes nothing", async () => {
  const db = await freshDb();
  assert.ok(run("migrate", db.url).ok);
  assert.match(run("seed", db.url).out, /seeded 14 services/);
  const [{ n }] = await db.sql`select count(*)::int as n from services where overview <> '' and jsonb_array_length(sections) > 0`;
  assert.equal(n, 14, "all services carry the long-form content");
  const before = await db.sql`select id, updated_at from services order by id`;
  const again = run("seed", db.url);
  assert.ok(again.ok);
  assert.doesNotMatch(again.out, /seeded|service content/, "idempotent");
  assert.deepEqual(await db.sql`select id, updated_at from services order by id`, before);
  await db.sql.end();
});

test("a crash while seeding leaves nothing half-done; the next start completes it", async () => {
  const db = await freshDb();
  assert.ok(run("migrate", db.url).ok);
  await db.sql.unsafe(`
    create function fail_on_8th() returns trigger language plpgsql as $$
    begin if (select count(*) from services) >= 7 then raise exception 'simulated crash'; end if; return new; end $$;
    create trigger crash before insert on services for each row execute function fail_on_8th();`);
  const crashed = run("seed", db.url);
  assert.equal(crashed.ok, false);
  assert.match(crashed.out, /simulated crash/);
  assert.equal((await db.sql`select count(*)::int as n from services`)[0].n, 0, "rolled back");
  await db.sql.unsafe("drop trigger crash on services");
  assert.match(run("seed", db.url).out, /seeded 14 services/);
  assert.equal((await db.sql`select count(*)::int as n from services`)[0].n, 14);
  await db.sql.end();
});

test("content upgrade: untouched rows are refreshed once, admin-edited rows are kept", async () => {
  const db = await freshDb();
  assert.ok(run("migrate", db.url).ok);
  assert.ok(run("seed", db.url).ok);
  // Simulate an install from before the content upgrade: old content, older version marker, one row edited in the admin.
  await db.sql`update services set overview = '', sections = '[]'::jsonb, updated_at = created_at`;
  await db.sql`update services set summary = 'متن ویرایش‌شده مدیر', updated_at = created_at + interval '1 minute' where slug = 'seo-audit'`;
  await db.sql`update settings set value = '1'::jsonb where key = 'seed:service-content-version'`;
  const out = run("seed", db.url).out;
  assert.match(out, /service content v\d+: updated 13, kept \(edited or missing\): seo-audit/);
  const [edited] = await db.sql`select summary, overview from services where slug = 'seo-audit'`;
  assert.deepEqual(edited, { summary: "متن ویرایش‌شده مدیر", overview: "" }, "the owner's edit is untouched");
  const [{ n }] = await db.sql`select count(*)::int as n from services where overview <> ''`;
  assert.equal(n, 13);
  assert.doesNotMatch(run("seed", db.url).out, /service content/, "runs once per version");
  await db.sql.end();
});

test("migrations: a second run is a no-op and the schema matches drizzle/", async () => {
  const db = await freshDb();
  assert.ok(run("migrate", db.url).ok);
  assert.ok(run("migrate", db.url).ok);
  const [{ n }] = await db.sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  const files = execFileSync("sh", ["-c", "ls drizzle/*.sql | wc -l"], { encoding: "utf8" }).trim();
  assert.equal(n, Number(files), "every migration file applied exactly once");
  await db.sql.end();
});

test("editorial upgrade repairs an earlier automatic seed, preserves custom fields and is repeatable", async () => {
  const db = await freshDb();
  assert.ok(run("migrate", db.url).ok); assert.ok(run("seed", db.url).ok);
  const old = contentColumns(previousServiceContent["keyword-research"]);
  const jsonColumns = new Set(["sections", "problems", "includes", "process", "situations", "business_types", "deliverables", "faqs", "related_slugs"]);
  const values = Object.fromEntries(Object.entries(old).map(([key, value]) => [key, jsonColumns.has(key) ? db.sql.json(value) : value]));
  await db.sql`update services set ${db.sql(values)}, updated_at=created_at+interval '1 minute' where slug='keyword-research'`;
  await db.sql`update services set summary='Owner custom summary', published=false where slug='keyword-research'`;
  await db.sql`update settings set value='2'::jsonb where key='seed:service-content-version'`;
  await db.sql`delete from settings where key='seed:editorial-copy-v3'`;
  await db.sql`insert into settings(key,value) values ('pages',${db.sql.json({ home: { subtitle: pageCopy.home.subtitle[0], metaTitle: "Owner custom title" }, contact: { subtitle: "Owner contact text" } })}) on conflict(key) do update set value=excluded.value`;
  await db.sql`insert into settings(key,value) values ('general',${db.sql.json({headerLogo:"/uploads/owner-logo.png"})}) on conflict(key) do update set value=excluded.value`;
  assert.ok(run("seed", db.url).ok);
  const [service] = await db.sql`select summary,hero_description,overview,published from services where slug='keyword-research'`;
  assert.equal(service.summary, "Owner custom summary"); assert.equal(service.published, false);
  assert.equal(service.hero_description, serviceContent["keyword-research"].heroDescription);
  assert.equal(service.overview, serviceContent["keyword-research"].overview);
  const [pages] = await db.sql`select value from settings where key='pages'`;
  assert.equal(pages.value.home.subtitle, pageCopy.home.subtitle[1]);
  assert.equal(pages.value.home.metaTitle, "Owner custom title"); assert.equal(pages.value.contact.subtitle, "Owner contact text");
  assert.equal((await db.sql`select value from settings where key='general'`)[0].value.headerLogo, "/uploads/owner-logo.png");
  const before = await db.sql`select id,updated_at from services order by id`;
  assert.ok(run("seed", db.url).ok); assert.deepEqual(await db.sql`select id,updated_at from services order by id`, before);
  await db.sql.end();
});
