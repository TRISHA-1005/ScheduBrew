import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'supabase/migrations/202610200001_initial_schedu_brew_schema.sql',
  'lib/supabase/require-account.ts',
  'app/business/layout.tsx',
  'app/customer/layout.tsx',
  'components/schedu/auth-card.tsx',
  'components/schedu/sign-up-card.tsx',
  'docs/SUPABASE_POSTGRES_SETUP.md',
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Missing required database integration files:', missing.join(', '));
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, required[0]), 'utf8');
const signup = fs.readFileSync(path.join(root, 'components/schedu/sign-up-card.tsx'), 'utf8');
const login = fs.readFileSync(path.join(root, 'components/schedu/auth-card.tsx'), 'utf8');
const accountGuard = fs.readFileSync(path.join(root, 'lib/supabase/require-account.ts'), 'utf8');
const checks = [
  ['profiles table and authoritative account_type', /create table if not exists public\.profiles[\s\S]*account_type text not null[\s\S]*'business_owner'/.test(sql)],
  ['business owner ownership relation', /owner_id uuid not null references public\.profiles\(id\)/.test(sql)],
  ['row level security enabled for profiles', /alter table public\.profiles enable row level security/.test(sql)],
  ['role metadata used only as signup request', /account_type: role/.test(signup)],
  ['login verifies database account_type', /select\("account_type"\)/.test(login)],
  ['server-side account type guard', /requireAccountType\("business_owner"\)/.test(fs.readFileSync(path.join(root, 'app/business/layout.tsx'), 'utf8')) && /requireAccountType\("customer"\)/.test(fs.readFileSync(path.join(root, 'app/customer/layout.tsx'), 'utf8'))],
  ['order creation is a database function', /create or replace function public\.place_order/.test(sql)],
  ['no direct order insert grant to authenticated clients', !/grant\s+insert[^;]*\bon\s+public\.orders\s+to\s+authenticated/i.test(sql)],
  ['business activation is not granted to owner clients', !/grant\s+update\s*\([^)]*status[^)]*\)\s*on\s+public\.businesses\s+to\s+authenticated/i.test(sql)],
  ['account guard checks profile rows', /from\("profiles"\)/.test(accountGuard)],
  ['signup trigger limits account types', /v_account_type in \('business', 'business_owner'\)/.test(sql) && /v_account_type <> 'customer'/.test(sql)],
  ['profile role is not client-updatable', /grant update \(full_name, phone\) on public\.profiles to authenticated/.test(sql)],
  ['order statuses have database transition validation', /create or replace function public\.enforce_order_status_transition/.test(sql)],
  ['email confirmation rejects external redirects', /requestedNext\.startsWith\("\/"\) && !requestedNext\.startsWith\("\/\/"\)/.test(fs.readFileSync(path.join(root, 'app/auth/confirm/route.ts'), 'utf8'))],
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`\n${checks.length} security integration checks passed.`);
