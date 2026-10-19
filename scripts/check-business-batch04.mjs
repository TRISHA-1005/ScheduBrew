/**
 * Static project integration check. No credentials are read or transmitted.
 * Execute at the project root: node scripts/check-business-batch04.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd, exit } from 'node:process';

const root=cwd();
const required=[
  'package.json',
  'app/business/menu/page.tsx',
  'components/business/business-menu.tsx',
  'components/business/menu-demo-data.ts',
  'components/business/menu.module.css',
  'components/business/business-dashboard.tsx',
  'components/business/business-orders.tsx',
  'components/business/business-pickup-schedule.tsx',
  'components/business/dashboard.module.css',
  'components/business/demo-business-data.ts',
  'components/business/pickup-demo-data.ts',
  'lib/supabase/server.ts',
  'public/schedu/discovery/product-spanish-latte.jpg',
  'public/schedu/discovery/product-brown-sugar-milk-tea.jpg',
  'public/schedu/discovery/product-creamy-carbonara.jpg',
];
let failed=0;
for (const file of required) {
  const ok=existsSync(join(root,file));
  console.log(`${ok?'PASS':'FAIL'} ${file}`);
  if(!ok) failed++;
}
for(const file of ['components/business/business-dashboard.tsx','components/business/business-orders.tsx','components/business/business-pickup-schedule.tsx']){
  if(!existsSync(join(root,file))) continue;
  const wired=readFileSync(join(root,file),'utf8').includes('/business/menu');
  console.log(`${wired?'PASS':'FAIL'} Menu sidebar link: ${file}`);
  if(!wired) failed++;
}
console.log(`\n${failed===0?'All static Batch 4 checks passed.':'Batch 4 setup needs attention: '+failed+' checks failed.'}`);
console.log('Next: npm run build, then test the menu page in your browser.');
if(failed) exit(1);
