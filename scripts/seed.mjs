// Idempotent seed, run on every container start: creates the admin account from
// ADMIN_EMAIL / ADMIN_PASSWORD when no user exists, fills empty content tables
// with the initial texts and, once per content version, refreshes service pages
// that were never edited in the admin. Rows edited by the owner are never touched.
import bcrypt from "bcryptjs";
import postgres from "postgres";

import { categories, faqs, services } from "./seed-data.mjs";
import { contentColumns, SERVICE_CONTENT_VERSION, serviceContent } from "./service-content/index.mjs";

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

for (const c of categories) {
  await sql`
    insert into categories (slug, title, description, sort_order)
    values (${c.slug}, ${c.title}, ${c.description}, ${c.sortOrder})
    on conflict (slug) do nothing`;
}

const JSON_COLUMNS = new Set(["sections", "problems", "includes", "process", "situations", "business_types", "deliverables", "faqs", "related_slugs"]);
const asSqlValues = (columns) =>
  Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, JSON_COLUMNS.has(k) ? sql.json(v) : v]));

let seededServices = false;
if (await isEmpty("services")) {
  seededServices = true;
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
    await sql`insert into services ${sql(asSqlValues(row))}`;
  }
  console.log(`seeded ${services.length} services`);
}

// Upgrade existing installs to the current service page content, once. Only
// rows that were never saved from the admin panel (updated_at still equals
// created_at) are replaced, so the owner's edits are always kept.
const CONTENT_KEY = "seed:service-content-version";
const [done] = await sql`select value from settings where key = ${CONTENT_KEY}`;
if (seededServices) {
  // Fresh install: the rows above already carry the current content.
  await sql`insert into settings (key, value) values (${CONTENT_KEY}, ${sql.json(SERVICE_CONTENT_VERSION)}) on conflict (key) do nothing`;
} else if (!done || Number(done.value) < SERVICE_CONTENT_VERSION) {
  const updated = [];
  const kept = [];
  for (const [slug, content] of Object.entries(serviceContent)) {
    const result = await sql`
      update services set ${sql(asSqlValues(contentColumns(content)))}, updated_at = now()
      where slug = ${slug} and updated_at = created_at`;
    (result.count > 0 ? updated : kept).push(slug);
  }
  await sql`
    insert into settings (key, value) values (${CONTENT_KEY}, ${sql.json(SERVICE_CONTENT_VERSION)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  console.log(`service content v${SERVICE_CONTENT_VERSION}: updated ${updated.length}` + (kept.length ? `, kept (edited or missing): ${kept.join(", ")}` : ""));
}

if (await isEmpty("faqs")) {
  for (const f of faqs) {
    await sql`insert into faqs (page, question, answer, sort_order) values (${f.page}, ${f.question}, ${f.answer}, ${f.sortOrder})`;
  }
  console.log(`seeded ${faqs.length} faqs`);
}

await sql.end();
