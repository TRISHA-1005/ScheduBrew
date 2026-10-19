import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'app/business/page.tsx',
  'app/business/orders/page.tsx',
  'app/business/orders/[orderId]/label/page.tsx',
  'components/business/business-dashboard.tsx',
  'components/business/demo-business-data.ts',
  'components/business/business-orders.tsx',
  'components/business/business-pickup-label.tsx',
  'components/business/dashboard.module.css',
  'components/business/orders.module.css',
  'components/business/pickup-label.module.css',
  'package.json',
  '.env.local',
];
const missing = required.filter(file => !existsSync(join(process.cwd(), file)));
for (const file of required) console.log(`${missing.includes(file) ? 'MISSING' : 'OK     '} ${file}`);
if (missing.length) {
  console.error('\nFix missing files before running the new Business Orders page.');
  process.exitCode = 1;
} else {
  const dashboard = readFileSync('components/business/business-dashboard.tsx', 'utf8');
  const data = readFileSync('components/business/demo-business-data.ts', 'utf8');
  const orders = readFileSync('components/business/business-orders.tsx', 'utf8');
  const checks = [
    ['Dashboard links to Order Management', dashboard.includes('href="/business/orders"')],
    ['Shared status data includes cancellation', data.includes('"cancelled"')],
    ['Order list saves status changes to shared key', orders.includes('BUSINESS_STATUS_STORAGE')],
    ['Test pickup label route exists', existsSync('app/business/orders/[orderId]/label/page.tsx')],
  ];
  for (const [label, passed] of checks) {
    console.log(`${passed ? 'PASS' : 'FAIL'}    ${label}`);
    if (!passed) process.exitCode = 1;
  }
  if (!process.exitCode) console.log('\nBusiness Batch 2 file checks passed.');
}
