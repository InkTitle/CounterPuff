import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");
const pool = new pg.Pool({ connectionString: url });

const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@counterpuff.app").toLowerCase();
const adminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "CounterPuff-Admin-2026";
const demoEmail = "alex@counterpuff.app";
const demoPass = "CounterPuff-User-2026";
const pendingEmail = "sam@counterpuff.app";

async function upsertUser({ email, password, fullName, role, status, country, currency }) {
  const hash = await bcrypt.hash(password, 12);
  const existing = await pool.query("select id from users where email = $1", [email]);
  if (existing.rowCount) {
    await pool.query(
      "update users set password_hash=$2, full_name=$3, role=$4, status=$5, country=$6, currency=$7, updated_at=now() where email=$1",
      [email, hash, fullName, role, status, country, currency],
    );
    return existing.rows[0].id;
  }
  const res = await pool.query(
    `insert into users (email, password_hash, full_name, role, status, country, currency, timezone, terms_accepted_at)
     values ($1,$2,$3,$4,$5,$6,$7,'UTC', now()) returning id`,
    [email, hash, fullName, role, status, country, currency],
  );
  return res.rows[0].id;
}

const adminId = await upsertUser({
  email: adminEmail,
  password: adminPass,
  fullName: "CounterPuff Admin",
  role: "admin",
  status: "ACTIVE",
  country: "US",
  currency: "USD",
});

const alexId = await upsertUser({
  email: demoEmail,
  password: demoPass,
  fullName: "Alex Rivera",
  role: "user",
  status: "ACTIVE",
  country: "US",
  currency: "USD",
});

const samId = await upsertUser({
  email: pendingEmail,
  password: demoPass,
  fullName: "Sam Taylor",
  role: "user",
  status: "PENDING_APPROVAL",
  country: "GB",
  currency: "GBP",
});

await pool.query(
  `insert into user_profiles (user_id, display_name, onboarding_complete, onboarding_step, support_track, quit_plan_type, quit_date)
   values ($1,'Alex', true, 6, 'single-product', 'immediate', current_date - 3)
   on conflict (user_id) do update set onboarding_complete=true, quit_date=excluded.quit_date, support_track='single-product', quit_plan_type='immediate'`,
  [alexId],
);
await pool.query(
  `insert into user_profiles (user_id, display_name, onboarding_complete) values ($1,'Admin', true)
   on conflict (user_id) do nothing`,
  [adminId],
);
await pool.query(
  `insert into user_profiles (user_id, display_name, onboarding_complete) values ($1,'Sam', false)
   on conflict (user_id) do nothing`,
  [samId],
);

await pool.query("delete from user_products where user_id=$1", [alexId]);
await pool.query(
  `insert into user_products (user_id, product_type, quantity_per_day, pack_size, price_per_pack, is_estimate)
   values ($1,'cigarettes', 12, 20, 9.5, true)`,
  [alexId],
);
await pool.query("delete from user_triggers where user_id=$1", [alexId]);
await pool.query(
  `insert into user_triggers (user_id, trigger_key, is_primary) values ($1,'morning', true), ($1,'after_meals', false)`,
  [alexId],
);
await pool.query("delete from quit_plans where user_id=$1", [alexId]);
await pool.query(
  `insert into quit_plans (user_id, plan_type, target_date, started_at, status)
   values ($1,'immediate', current_date - 3, now(), 'active')`,
  [alexId],
);

const flags = [
  ["ebook", "In-app eBook reader and download"],
  ["sos", "Craving SOS tools"],
  ["community", "Community feed, comments, and chat"],
  ["progress", "Progress and reward trackers"],
  ["reminders", "Reminder preferences"],
  ["support", "Support tickets"],
  ["onboarding", "Tobacco profile onboarding"],
];
for (const [key, description] of flags) {
  await pool.query(
    `insert into feature_flags (key, enabled, description) values ($1, true, $2)
     on conflict (key) do update set description=excluded.description`,
    [key, description],
  );
}

const achievements = [
  ["first_step", "First Step", "Completed the tobacco profile", "social"],
  ["novice_deflector", "Novice Deflector", "Managed five cravings with SOS tools", "social"],
  ["habit_breaker", "Habit Breaker", "Seven smoke-free days in a streak", "social"],
  ["steady_reader", "Steady Reader", "Reached 50% of the authorized eBook", "social"],
  ["profile_ready", "Profile Ready", "Saved product and cost details", "social"],
  ["community_leader", "Community Leader", "Sustained constructive community participation", "social"],
];
for (const [id, name, description, category] of achievements) {
  await pool.query(
    `insert into achievements (id, name, description, category) values ($1,$2,$3,$4)
     on conflict (id) do update set name=excluded.name, description=excluded.description`,
    [id, name, description, category],
  );
}

for (const uid of [alexId, adminId]) {
  const has = await pool.query("select id from entitlements where user_id=$1 and product_key='ebook'", [uid]);
  if (!has.rowCount) {
    await pool.query(
      `insert into entitlements (user_id, product_key, status, source)
       values ($1,'ebook','active','manual'), ($1,'app','active','manual')`,
      [uid],
    );
  }
}

await pool.query("update ebook_versions set is_active=false");
const existingBook = await pool.query("select id from ebook_versions where file_path=$1", [
  "private/ebooks/counterpuff-method.pdf",
]);
if (!existingBook.rowCount) {
  await pool.query(
    `insert into ebook_versions (title, version, file_path, page_count, is_active, uploaded_by)
     values ('The CounterPuff Method', 'companion-placeholder', 'private/ebooks/counterpuff-method.pdf', 8, true, $1)`,
    [adminId],
  );
} else {
  await pool.query("update ebook_versions set is_active=true, page_count=8 where id=$1", [existingBook.rows[0].id]);
}

await pool.query(
  `insert into account_status_history (user_id, from_status, to_status, reason, admin_id)
   values ($1, 'PENDING_APPROVAL', 'ACTIVE', 'Seeded demo account', $2)`,
  [alexId, adminId],
);

console.log("seed complete");
console.log("admin", adminEmail);
console.log("demo", demoEmail);
await pool.end();
