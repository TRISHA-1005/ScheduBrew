import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
let ts;
try {
  ts = require("typescript");
} catch {
  ts = require("/usr/local/lib/node_modules/typescript");
}

const files = [
  "app/auth/sign-up/page.tsx",
  "app/auth/sign-up-success/page.tsx",
  "components/schedu/sign-up-card.tsx",
  "components/schedu/auth-card.tsx",
];

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing ${relativePath}`);
  const source = fs.readFileSync(absolutePath, "utf8");
  const parsed = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(parsed.parseDiagnostics.length, 0, `${relativePath} contains TSX syntax errors`);
}

const signup = fs.readFileSync(path.join(root, "components/schedu/sign-up-card.tsx"), "utf8");
const authCard = fs.readFileSync(path.join(root, "components/schedu/auth-card.tsx"), "utf8");
const route = fs.readFileSync(path.join(root, "app/auth/sign-up/page.tsx"), "utf8");

assert.ok(authCard.includes("/auth/sign-up?role=${kind}"), "Sign in pages must preserve the selected account type");
assert.ok(route.includes("role=customer") && route.includes("role=business"), "Account chooser must link to both account types");
assert.ok(signup.includes('role = isBusiness ? "business_owner" : "customer"'), "Sign up must store the intended account role in auth metadata");
assert.ok(signup.includes("shop_name") && signup.includes("business_address"), "Business owner details must be included in auth metadata");
assert.ok(signup.includes("full_name") && signup.includes("phone"), "Shared profile fields must be included in auth metadata");
assert.ok(signup.includes("password !== confirmPassword"), "Password confirmation must be validated");
assert.ok(signup.includes("emailRedirectTo"), "Email confirmation redirect must be configured");

const css = fs.readFileSync(path.join(root, "components/schedu/schedu.module.css"), "utf8");
for (const className of ["signupMain", "signupHero", "signupCard", "signupChooser", "signupChoices", "signupSuccessActions"]) {
  assert.ok(css.includes(`.${className} `) || css.includes(`.${className}{`) || css.includes(`.${className} {`), `Missing style for ${className}`);
}

console.log("PASS Registration TSX syntax: 4 files");
console.log("PASS Customer and business owner account paths");
console.log("PASS Role metadata, profile fields, password confirmation, and email confirmation redirect");
console.log("PASS Registration and success page styles");
console.log("All account registration checks passed.");
