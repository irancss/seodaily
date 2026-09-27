// Idempotent first-run seed: creates the admin account from ADMIN_EMAIL /
// ADMIN_PASSWORD when no user exists, and fills empty content tables with the
// texts from the design. It never overwrites rows that already exist.
import bcrypt from "bcryptjs";
import postgres from "postgres";

import { categories, faqs, services } from "./seed-data.mjs";

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

if (await isEmpty("services")) {
  for (const s of services) {
    await sql`
      insert into services (slug, category, title, english_title, icon, summary, hero_description, process, sort_order)
      values (${s.slug}, ${s.category}, ${s.title}, ${s.englishTitle}, ${s.icon}, ${s.summary},
              ${s.heroDescription}, ${sql.json(s.process)}, ${s.sortOrder})`;
  }
  console.log(`seeded ${services.length} services`);
}

if (await isEmpty("faqs")) {
  for (const f of faqs) {
    await sql`insert into faqs (page, question, answer, sort_order) values (${f.page}, ${f.question}, ${f.answer}, ${f.sortOrder})`;
  }
  console.log(`seeded ${faqs.length} faqs`);
}

await sql.end();
