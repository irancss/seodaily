// Idempotent seed, run on every container start: creates the admin account from
// ADMIN_EMAIL / ADMIN_PASSWORD when no user exists, fills empty content tables
// with the initial texts and, once per content version, refreshes shipped copy.
// Untouched rows are upgraded in full; edited rows keep all custom field values.
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { isDeepStrictEqual } from "node:util";

import { categories, faqs, services } from "./seed-data.mjs";
import { contentColumns, SERVICE_CONTENT_VERSION, serviceContent, previousServiceContent } from "./service-content/index.mjs";
import { pageCopy } from "./editorial-copy.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

async function isEmpty(table) {
  const [{ count }] = await sql`select count(*)::int as count from ${sql(table)}`;
  return count === 0;
}

const [{ count: userCount }] = await sql`select count(*)::int as count from users`;
if (userCount === 0) {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 8) {
    console.warn(
      "No admin user exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) to create one.",
    );
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await sql`insert into users (email, name, password_hash) values (${email}, ${"مدیر"}, ${passwordHash})`;
    console.log(`admin user created: ${email}`);
  }
}

// Each group below is written in one transaction: a crash halfway (first
// container start, lost DB connection) leaves nothing half-seeded, so the next
// start sees an empty table and seeds it completely.
await sql.begin(async (tx) => {
  for (const c of categories) {
    await tx`
      insert into categories (slug, title, description, sort_order)
      values (${c.slug}, ${c.title}, ${c.description}, ${c.sortOrder})
      on conflict (slug) do nothing`;
  }
});

const JSON_COLUMNS = new Set(["sections", "problems", "includes", "process", "situations", "business_types", "deliverables", "faqs", "related_slugs"]);
const asSqlValues = (columns) =>
  Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, JSON_COLUMNS.has(k) ? sql.json(v) : v]));

const CONTENT_KEY = "seed:service-content-version";
let seededServices = false;
if (await isEmpty("services")) {
  seededServices = true;
  await sql.begin(async (tx) => {
    for (const s of services) {
      const content = serviceContent[s.slug];
      const row = {
        slug: s.slug,
        category: s.category,
        title: s.title,
        english_title: s.englishTitle,
        icon: s.icon,
        summary: s.summary,
        hero_description: s.heroDescription,
        process: s.process,
        sort_order: s.sortOrder,
        ...(content ? contentColumns(content) : {}),
      };
      await tx`insert into services ${tx(asSqlValues(row))}`;
    }
    // Fresh install: the rows above already carry the current content.
    await tx`insert into settings (key, value) values (${CONTENT_KEY}, ${tx.json(SERVICE_CONTENT_VERSION)}) on conflict (key) do nothing`;
  });
  console.log(`seeded ${services.length} services`);
}

// Upgrade existing installs once. Replace untouched rows in full; for previously
// saved rows, upgrade only fields that still exactly match the shipped v2 copy.
const [done] = await sql`select value from settings where key = ${CONTENT_KEY}`;
if (!seededServices && (!done || Number(done.value) < SERVICE_CONTENT_VERSION)) {
  const updated = [];
  const kept = [];
  await sql.begin(async (tx) => {
    for (const [slug, content] of Object.entries(serviceContent)) {
      const result = await tx`
        update services set ${tx(asSqlValues(contentColumns(content)))}, updated_at = now()
        where slug = ${slug} and updated_at = created_at`;
      if (result.count > 0) { updated.push(slug); continue; }
      // Earlier automatic upgrades also changed updated_at. Compare the actual
      // shipped v2 value per field; a timestamp cannot distinguish those from
      // the owner's later edits. Never overwrite a field with different text.
      const [row] = await tx`select * from services where slug = ${slug} for update`;
      const before = contentColumns(previousServiceContent[slug]);
      const patch = Object.fromEntries(Object.entries(contentColumns(content)).filter(([key, value]) => row && !isDeepStrictEqual(before[key], value) && isDeepStrictEqual(row[key], before[key])));
      if (Object.keys(patch).length) {
        await tx`update services set ${tx(asSqlValues(patch))}, updated_at = now() where id = ${row.id}`;
        updated.push(slug);
      } else kept.push(slug);
    }
    await tx`
      insert into settings (key, value) values (${CONTENT_KEY}, ${tx.json(SERVICE_CONTENT_VERSION)})
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
  });
  console.log(`service content v${SERVICE_CONTENT_VERSION}: updated ${updated.length}` + (kept.length ? `, kept (edited or missing): ${kept.join(", ")}` : ""));
}

// Saved page settings can still contain the original defaults. Replace only
// exact old wording, preserving all custom fields, logos and unrelated settings.
await sql.begin(async (tx) => {
  const key = "seed:editorial-copy-v3";
  if ((await tx`select key from settings where key = ${key}`).length) return;
  const [row] = await tx`select value from settings where key = 'pages' for update`;
  let changed = 0;
  if (row?.value && typeof row.value === "object" && !Array.isArray(row.value)) {
    const value = structuredClone(row.value);
    for (const [page, fields] of Object.entries(pageCopy)) for (const [field, [before, after]] of Object.entries(fields)) {
      if (value[page]?.[field] === before) { value[page][field] = after; changed++; }
    }
    if (changed) await tx`update settings set value = ${tx.json(value)}, updated_at = now() where key = 'pages'`;
  }
  await tx`insert into settings(key,value) values (${key},'true'::jsonb) on conflict(key) do nothing`;
  console.log(`editorial copy v3: updated ${changed} saved page fields`);
});

if (await isEmpty("faqs")) {
  await sql.begin(async (tx) => {
    for (const f of faqs) {
      await tx`insert into faqs (page, question, answer, sort_order) values (${f.page}, ${f.question}, ${f.answer}, ${f.sortOrder})`;
    }
  });
  console.log(`seeded ${faqs.length} faqs`);
}

await sql.end();
